from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Header
from fastapi.responses import RedirectResponse, JSONResponse
from jose import JWTError
from fastapi import Response, Request
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.controllers.auth_controller import register_user, login_user
from server.services.spotify import get_spotify_auth_url, get_spotify_token
from server.controllers.auth_controller import logout_user
from server.core.security import verify_token, create_access_token
from server.db.models.user import User
from server.core.config import settings
from pydantic import BaseModel
import secrets
# Temporary in-memory store for tokens returned by Spotify callback keyed by the 'state'
# This is simple and OK for development; for production use a persistent/short-lived store
# (Redis, DB, etc.) and rotate/expire entries.
_spotify_temp_store: dict[str, dict] = {}

router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user)

@router.post("/login", response_model=TokenResponse,status_code=status.HTTP_200_OK)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)


@router.get("/spotify")
def spotify_auth(state: str = Query(...)):
    """
    Redirige a Spotify para autenticación
    El frontend genera el state y lo pasa como query parameter
    """
    print("State recibido del frontend:", state)
    
    auth_url = get_spotify_auth_url(state)
    return RedirectResponse(auth_url)

@router.get("/spotify/callback")
def spotify_callback(
    response: Response,
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    error: str = Query(None)
):
    """
    Callback de Spotify después de la autenticación
    """
    if error:
        # Usuario canceló o Spotify devolvió error → redirigir al frontend con el error
        return RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-callback?error={error}&state={state}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorización no recibido")
    
    print("State recibido de Spotify:", state)
    
    # En este caso, el frontend es responsable de validar el state
    
    try:
        token_data = get_spotify_token(code=code)

        # Store the token_data temporarily keyed by the state so the frontend can
        # exchange it for a server-signed JWT in a separate request.
        # NOTE: This avoids placing tokens in URL params and avoids relying on cookies.
        _spotify_temp_store[state] = {
            "access_token": token_data.get('access_token'),
            "refresh_token": token_data.get('refresh_token'),
            "expires_in": token_data.get('expires_in')
        }

        # Redirect back to frontend which will read `state` and call the exchange endpoint
        response = RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-callback?state={state}")
        return response

    except Exception as e:
        # Redirigir al frontend con un indicador de error genérico
        print(f"HTTP error: {e} - Path: {request.url}")
        return RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-callback?error=token_exchange_failed&state={state}")


@router.get("/spotify/status")
def spotify_status(request: Request):
    """
    Returns whether a Spotify access token cookie is present.
    Optionally, could call Spotify /me to verify validity, but this keeps it fast.
    """
    # Prefer Authorization: Bearer <spotify_jwt>. For backward compatibility we
    # no longer read cookies. If a cookie-based approach is detected elsewhere it
    # should be migrated to the JWT flow.
    auth = request.headers.get('Authorization')
    if not auth or not auth.startswith('Bearer '):
        return {"connected": False}

    token = auth.split(' ', 1)[1]
    try:
        payload = verify_token(token)
    except Exception:
        return {"connected": False}

    # Expect a payload carrying spotify tokens
    spotify_info = payload.get('spotify')
    return {"connected": bool(spotify_info and spotify_info.get('access_token'))}


@router.post("/spotify/disconnect")
def spotify_disconnect(request: Request):
    """
    Clears Spotify access and refresh token cookies and returns JSON 200.
    Avoid redirecting so clients using POST don't get a 405 on follow-up.
    """
    # Expect Authorization: Bearer <spotify_jwt>
    auth = request.headers.get('Authorization')
    response = JSONResponse({"disconnected": True})
    if not auth or not auth.startswith('Bearer '):
        return response

    token = auth.split(' ', 1)[1]
    try:
        payload = verify_token(token)
    except Exception:
        return response

    # Invalidate client-side token by instructing frontend to remove it. Server doesn't
    # hold long-lived spotify session state in this design.
    return response

@router.post("/spotify/revoke")
def spotify_revoke(request: Request):
    """
    Revoke attempt: accept Authorization: Bearer <spotify_jwt>, try to refresh the
    refresh_token to make existing refresh_token less useful, and instruct frontend
    to remove stored JWT.
    """
    auth = request.headers.get('Authorization')
    res = JSONResponse({"revoked": True})
    if not auth or not auth.startswith('Bearer '):
        return res

    token = auth.split(' ', 1)[1]
    try:
        payload = verify_token(token)
    except Exception:
        return res

    spotify_info = payload.get('spotify') or {}
    refresh_token = spotify_info.get('refresh_token')

    # Try to hit Spotify token endpoint to consume or rotate the refresh token.
    if refresh_token:
        try:
            import urllib.request
            import urllib.parse
            basic_token = __import__('base64').b64encode(f"{settings.SPOTIFY_CLIENT_ID}:{settings.SPOTIFY_CLIENT_SECRET}".encode()).decode()
            data = urllib.parse.urlencode({
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            }).encode()
            req = urllib.request.Request(
                url="https://accounts.spotify.com/api/token",
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": f"Basic {basic_token}",
                },
                method="POST",
            )
            try:
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass
        except Exception:
            pass

    return res


@router.get('/spotify/exchange')
def spotify_exchange(state: str = Query(...)):
    """
    Exchange the temporary token_data (stored at callback time keyed by state) for
    a server-signed JWT that the frontend will store and send as Authorization: Bearer <jwt>.
    """
    token_data = _spotify_temp_store.pop(state, None)
    if not token_data:
        raise HTTPException(status_code=404, detail="State not found or expired")

    # Create a JWT containing the spotify tokens. Set short expiry (access token lifetime)
    payload = {
        "spotify": {
            "access_token": token_data.get('access_token'),
            "refresh_token": token_data.get('refresh_token')
        }
    }
    # Use the expires_in if present to set expiry
    expires = None
    if token_data.get('expires_in'):
        from datetime import timedelta
        expires = timedelta(seconds=int(token_data.get('expires_in')))

    jwt_token = create_access_token(payload, expires_delta=expires)
    return {"spotify_jwt": jwt_token}



class LogoutRequest(BaseModel):
    session_id: int

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene información del usuario autenticado actual
    """
    try:
        # Verificar formato del header
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Formato de token inválido"
            )
        
        # Extraer token
        token = authorization.split(" ")[1]
        
        # Verificar token y obtener email
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )
        
        # Buscar usuario en la base de datos
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )
        
        return UserResponse.from_orm(user)
        
    except (JWTError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información del usuario"
        )

@router.post("/logout", status_code=200)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    """
    Ends the session by setting fecha_fin for the given session_id.
    """
   
    success = logout_user(db, payload.session_id)
    return {"success": success}
