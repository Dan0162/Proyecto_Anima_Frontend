"""
🎵 ENDPOINT MOCKUP PARA SPOTIFY
================================
Este archivo es OPCIONAL. Úsalo si quieres probar sin configurar OAuth de Spotify.

Para activarlo:
1. Renombra recommend.py a recommend_real.py
2. Renombra este archivo a recommend.py
3. Reinicia el servidor

O simplemente usa el endpoint /recommend/mockup
"""

from fastapi import APIRouter, Query, HTTPException
import json
import os
import random

router = APIRouter(prefix="/recommend", tags=["recommendations"])

# Cargar datos mockup desde el JSON
def load_mock_data():
    json_path = os.path.join(os.path.dirname(__file__), '../../../../recomendacionesSpotify.json')
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        # Datos de respaldo si no existe el archivo
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
    "happy": lambda tracks: tracks[:30],  # Primeras 30
    "sad": lambda tracks: tracks[:30],
    "angry": lambda tracks: tracks[:30],
    "relaxed": lambda tracks: tracks[:30],
    "energetic": lambda tracks: tracks[:30]
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
        "note": f"Recomendaciones mockup para {emotion}",
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