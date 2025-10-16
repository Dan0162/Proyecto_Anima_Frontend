from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Header
from fastapi.responses import RedirectResponse
from fastapi import Response, Request
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.controllers.auth_controller import register_user, login_user
from server.services.spotify import get_spotify_auth_url, get_spotify_token
import secrets

from server.core.security import verify_token
from server.db.models.user import User

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
        return RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-connect?error={error}&state={state}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorización no recibido")
    
    print("State recibido de Spotify:", state)
    
    # En este caso, el frontend es responsable de validar el state
    
    try:
        token_data = get_spotify_token(code=code)

        # Establecer tokens como cookies seguras (httpOnly)
        # Nota: en desarrollo usamos http://, por eso 'secure' no puede ser True en localhost without HTTPS
        access_token = token_data.get('access_token')
        refresh_token = token_data.get('refresh_token')
        expires_in = token_data.get('expires_in')

        # Set cookies on the response. httpOnly protects from JS access.
        # The cookie will be sent back on subsequent requests to the backend so the server can use it.
        # For production: set secure=True and samesite='Lax' or 'None' depending on cross-site needs.
        response = RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-connect?state={state}")
        # Lifetime: expires_in seconds (optional)
        if access_token:
            response.set_cookie(
                key="spotify_access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite='lax',
                max_age=expires_in or 3600,
                path='/'
            )
        if refresh_token:
            response.set_cookie(
                key="spotify_refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite='lax',
                max_age=60 * 60 * 24 * 30,  # 30 days
                path='/'
            )

        return response

    except Exception as e:
        # Redirigir al frontend con un indicador de error genérico
        print(f"HTTP error: {e} - Path: {request.url}")
        return RedirectResponse(url=f"http://127.0.0.1:3000/home/spotify-connect?error=token_exchange_failed&state={state}")


@router.get("/spotify/status")
def spotify_status(request: Request):
    """
    Returns whether a Spotify access token cookie is present.
    Optionally, could call Spotify /me to verify validity, but this keeps it fast.
    """
    connected = bool(request.cookies.get("spotify_access_token"))
    return {"connected": connected}


@router.post("/spotify/disconnect")
def spotify_disconnect():
    """
    Clears Spotify access and refresh token cookies.
    """
    response = RedirectResponse(url="/v1/auth/spotify/status")
    response.delete_cookie(key="spotify_access_token", path="/")
    response.delete_cookie(key="spotify_refresh_token", path="/")
    return response

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response, Header
from server.core.security import verify_token
from server.db.models.user import User

# ... código existente ...

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
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener información del usuario"
        )
