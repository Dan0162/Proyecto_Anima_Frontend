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
        ] * 30,  # ← Aumentado a 30 canciones de respaldo
        "emotion": "happy",
        "total_tracks": 30,
        "search_method": "fallback"
    }

# Mapeo de emociones a diferentes conjuntos de canciones - AHORA 30 CANCIONES
EMOTION_TRACK_FILTERS = {
    "happy": lambda tracks: tracks[:30],   # Primeras 30 canciones
    "sad": lambda tracks: tracks[:30],     # Primeras 30 canciones  
    "angry": lambda tracks: tracks[:30],   # Primeras 30 canciones
    "relaxed": lambda tracks: tracks[:30], # Primeras 30 canciones
    "energetic": lambda tracks: tracks[:30] # Primeras 30 canciones
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
    
    # Mezclar las canciones para variedad
    random.shuffle(all_tracks)
    
    # Aplicar filtro según emoción - ahora devuelve 30 canciones
    filter_func = EMOTION_TRACK_FILTERS[emotion]
    selected_tracks = filter_func(all_tracks)
    
    return {
        "tracks": selected_tracks,
        "emotion": emotion,
        "total_tracks": len(selected_tracks),
        "search_method": "mockup",
        "note": f"Recomendaciones mockup para {emotion} - 30 canciones",
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
            "note": "Sistema mockup funcionando correctamente - 30 canciones por emoción"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/debug-tracks")
def debug_tracks():
    """🔧 Endpoint para diagnosticar cuántas canciones hay disponibles"""
    mock_data = load_mock_data()
    all_tracks = mock_data.get("tracks", [])
    
    return {
        "total_tracks_in_json": len(all_tracks),
        "tracks_per_emotion": 30,
        "first_track": all_tracks[0] if all_tracks else None,
        "emotion_filters": {k: "tracks[:30]" for k in EMOTION_TRACK_FILTERS.keys()},
        "note": "Cada emoción devolverá 30 canciones aleatorias"
    }