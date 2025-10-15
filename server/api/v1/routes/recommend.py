from fastapi import APIRouter, Depends, Query, Header, HTTPException
from server.controllers.recommend_controller import recommend_songs_by_emotion
import requests
import json
import os
import random

router = APIRouter(prefix="/recommend", tags=["recommendations"])

@router.get("/")
def get_recommendations(
    emotion: str = Query(...),
    authorization: str = Header(..., alias="Authorization")
):
    """
    Devuelve una lista de canciones recomendadas según la emoción.
    - emotion: happy, sad, angry, relaxed, energetic
    - authorization: Header Authorization con formato "Bearer TU_TOKEN"
    """
    # Verificar que el header Authorization esté presente y tenga el formato correcto
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Token inválido o ausente. Formato requerido: 'Bearer TU_TOKEN'"
        )

    # Extraer el token (quitar "Bearer ")
    token = authorization.split(" ")[1].strip()
    
    if not token:
        raise HTTPException(status_code=401, detail="Token vacío")

    return recommend_songs_by_emotion(token, emotion)


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


# ============================================
# 🎵 ENDPOINTS MOCKUP
# ============================================

def load_mock_data():
    """Cargar datos mockup desde el JSON"""
    json_path = os.path.join(os.path.dirname(__file__), '../../../../recomendacionesSpotify.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return generate_fallback_data()

def generate_fallback_data():
    """Datos de respaldo si no se encuentra el JSON"""
    return {
        "tracks": [
            {
                "name": "Happy Song",
                "artists": [{"name": "Artist Name"}],
                "album": {
                    "name": "Album Name",
                    "images": [{"url": "https://via.placeholder.com/300"}]
                },
                "external_urls": {"spotify": "https://open.spotify.com"},
                "duration_ms": 180000,
                "popularity": 75
            }
        ] * 10,
        "emotion": "happy",
        "total_tracks": 10,
        "search_method": "fallback"
    }

# Mapeo de emociones a diferentes conjuntos de canciones
EMOTION_TRACK_FILTERS = {
    "happy": lambda tracks: tracks[:31],
    "sad": lambda tracks: tracks[:31],
    "angry": lambda tracks: tracks[:31],
    "relaxed": lambda tracks: tracks[:31],
    "energetic": lambda tracks: tracks[:31]
}

@router.get("/mockup")
def get_mockup_recommendations(emotion: str = Query(...)):
    """
    🎵 Devuelve recomendaciones musicales MOCKUP
    
    No requiere autenticación ni configuración de Spotify.
    Usa datos del archivo recomendacionesSpotify.json
    """
    emotion = emotion.lower()
    
    if emotion not in EMOTION_TRACK_FILTERS:
        raise HTTPException(
            status_code=400,
            detail=f"Emoción inválida. Opciones: {', '.join(EMOTION_TRACK_FILTERS.keys())}"
        )
    
    # Cargar datos
    mock_data = load_mock_data()
    all_tracks = mock_data.get("tracks", [])
    
    if not all_tracks:
        raise HTTPException(
            status_code=500,
            detail="No se pudieron cargar las canciones mockup"
        )
    
    # Aplicar filtro según emoción y aleatorizar
    random.shuffle(all_tracks)
    filter_func = EMOTION_TRACK_FILTERS[emotion]
    selected_tracks = filter_func(all_tracks)
    
    return {
        "tracks": selected_tracks,
        "emotion": emotion,
        "total_tracks": len(selected_tracks),
        "search_method": "mockup",
        "mockup_mode": True
    }


@router.get("/test-mockup")
def test_mockup():
    """
    🧪 Prueba que el sistema mockup funcione
    """
    try:
        data = load_mock_data()
        return {
            "status": "ok",
            "tracks_available": len(data.get("tracks", [])),
            "emotions": list(EMOTION_TRACK_FILTERS.keys()),
            "note": "Sistema mockup funcionando correctamente"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }