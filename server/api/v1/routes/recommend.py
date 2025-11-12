from fastapi import APIRouter, Depends, Query, Header, HTTPException, Request
from server.controllers.recommend_controller import recommend_songs_by_emotion
import requests
import json
import os
import random
from server.core.security import verify_token

router = APIRouter(prefix="/recommend", tags=["recommendations"])

@router.get("/")
def get_recommendations(
    request: Request,
    emotion: str = Query(...),
    authorization: str = Header(None, alias="Authorization")
):
    """
    Devuelve una lista de canciones recomendadas según la emoción.
    - emotion: happy, sad, angry, relaxed, energetic
    - authorization: Header Authorization con formato "Bearer TU_TOKEN"
    """
    token = None

    # Prefer Authorization header
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1].strip()

    # If no header token, attempt to retrieve httpOnly cookie set by OAuth callback (legacy)
    if not token:
        cookie_token = request.cookies.get('spotify_access_token')
        if cookie_token:
            token = cookie_token

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o ausente. Envíe Authorization header o configure Spotify (conexión)."
        )

    # If the provided token is a server-signed JWT (our spotify_jwt), decode and
    # extract the underlying spotify access_token
    spotify_access = token
    try:
        payload = verify_token(token)
        spotify_info = payload.get('spotify') if payload else None
        if spotify_info and spotify_info.get('access_token'):
            spotify_access = spotify_info.get('access_token')
    except Exception:
        # Not a JWT or invalid -> assume it is a raw Spotify access token string
        pass

    return recommend_songs_by_emotion(spotify_access, emotion)


@router.get("/test-spotify")
def test_spotify_connection(access_token: str = Query(...)):
    """
    Endpoint temporal para probar la conexión con Spotify
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Probar un endpoint simple de Spotify primero
    test_url = "https://api.spotify.com/v1/me"
    
    try:
        response = requests.get(test_url, headers=headers)
        if response.status_code == 200:
            user_data = response.json()
            return {
                "status": "success", 
                "user": user_data.get("display_name", "Unknown"),
                "email": user_data.get("email", "Unknown")
            }
        else:
            return {
                "status": "error",
                "status_code": response.status_code,
                "error": response.text
            }
    except Exception as e:
        return {"status": "exception", "error": str(e)}

# Mapeo de emociones a diferentes conjuntos de canciones
EMOTION_TRACK_FILTERS = {
    "happy": lambda tracks: tracks[:30],
    "sad": lambda tracks: tracks[:30],
    "angry": lambda tracks: tracks[:30],
    "relaxed": lambda tracks: tracks[:30],
    "energetic": lambda tracks: tracks[:30]
}



