import os
import requests
import secrets
from typing import Dict, Optional
from server.core.config import settings
import random
import base64


CLIENT_ID = settings.SPOTIFY_CLIENT_ID

CLIENT_SECRET = settings.SPOTIFY_CLIENT_SECRET

REDIRECT_URI = settings.SPOTIFY_REDIRECT_URI


SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1"



def get_spotify_auth_url(state: str):

    scopes = "user-read-email playlist-modify-private user-top-read"
    auth_url = f"{SPOTIFY_AUTH_URL}?response_type=code&client_id={CLIENT_ID}&scope={scopes}&redirect_uri={REDIRECT_URI}&state={state}"
    return auth_url


def get_spotify_token(code: str) -> Dict:
    """
    Intercambia un código de autorización por un token de acceso
    
    Args:
        code: Código de autorización recibido en el callback
    
    Returns:
        Dict con token data (access_token, refresh_token, etc.)
    """
    
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    # Spotify requires HTTP Basic auth header with client_id:client_secret
    basic_token = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {basic_token}",
    }

    try:
        response = requests.post(SPOTIFY_TOKEN_URL, data=payload, headers=headers, timeout=30)
        if response.status_code != 200:
            # Surface body for diagnostics during development
            try:
                body = response.json()
            except Exception:
                body = response.text
            raise Exception(f"Spotify token error {response.status_code}: {body}")
        
    except requests.exceptions.Timeout:
        raise Exception("Timeout al conectar con Spotify")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error de conexión: {e}")
    
    token_data = response.json()
    
    # Verifica que recibimos el token
    if 'access_token' not in token_data:
        raise Exception("No se recibió access_token en la respuesta")
    
    return token_data


def get_recommendations(access_token: str, emotion: str) -> Dict:
    """
    Obtiene canciones de playlists específicas según la emoción
    """
    headers = {"Authorization": f"Bearer {access_token}"}

    # Mapeo de emociones a playlists específicas
    emotion_to_playlists = {
        "happy": "3fq31QHkcmRPG1uCPYBddE",
        "sad": "5pQWxp24XiFAkndWCn7iRV", 
        "angry": "3K9T9G0qPgVxLPxWrfx8ro",
        "relaxed": "5co67rVaHtvFpvAhKwq3JZ",
        "energetic": "2EkZaoauD493JdANvmSMaY"
    }

    playlist_id = emotion_to_playlists.get(emotion.lower())
    
    if not playlist_id:
        return get_fallback_recommendations(access_token, emotion)
    
    all_tracks = []
    
    # Obtener todas las canciones de la playlist
    url = f"{SPOTIFY_API_BASE_URL}/playlists/{playlist_id}/tracks"
    
    try:
        print(f"Buscando canciones de la playlist para: {emotion}")
        
        # Primera request para obtener información básica
        params = {
            "limit": 50,
            "offset": 0
        }
        
        while True:
            response = requests.get(url, headers=headers, params=params)
            

            if response.status_code == 401:
                return {
                    "error": "token_expired",
                    "message": "El token de acceso ha caducado",
                    "status_code": 401,
                    "tracks": [],
                    "emotion": emotion
                }


            if response.status_code == 200:
                data = response.json()
                tracks_data = data.get("items", [])
                
                if not tracks_data:
                    break
                
                for track_item in tracks_data:
                    track = track_item.get("track")
                    if track and track.get("id"):  # Verificar que sea una canción válida
                        artists = [{"name": artist.get("name")} for artist in track.get("artists", [])[:2]]
                        
                        all_tracks.append({
                            "name": track.get("name"),
                            "artists": artists,
                            "album": {
                                "name": track.get("album", {}).get("name"),
                                "images": track.get("album", {}).get("images", [])
                            },
                            "external_urls": track.get("external_urls", {}),
                            "preview_url": track.get("preview_url"),
                            "uri": track.get("uri"),
                            "duration_ms": track.get("duration_ms"),
                            "popularity": track.get("popularity", 0),
                            "playlist_source": True
                        })
                
                # Verificar si hay más páginas
                if data.get("next"):
                    params["offset"] += params["limit"]
                else:
                    break
            else:
                print(f"Error obteniendo playlist: {response.status_code}")
                break
                
    except Exception as e:
        print(f"⚠️ Error buscando playlist: {e}")
        return get_fallback_recommendations(access_token, emotion)
    
    # Si no se encontraron tracks, usar búsqueda genérica
    if not all_tracks:
        print("Playlist vacía o no encontrada, usando búsqueda genérica...")
        return get_fallback_recommendations(access_token, emotion)
    
    # Seleccionar 30 canciones aleatorias
    random.shuffle(all_tracks)
    selected_tracks = all_tracks[:30]
    
    print(f"Encontradas {len(all_tracks)} canciones en la playlist, seleccionadas 30 aleatorias")
    
    return {
        "tracks": selected_tracks,
        "emotion": emotion,
        "total_tracks": len(selected_tracks),
        "playlist_used": playlist_id,
        "search_method": "playlist_based",
        "note": f"30 canciones aleatorias de la playlist de {emotion}",
        "available_in_playlist": len(all_tracks)
    }


def get_fallback_recommendations(access_token: str, emotion: str) -> Dict:
    """
    Función de respaldo si la playlist no está disponible
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Géneros como respaldo
    emotion_to_genres = {
        "happy": ["dance", "disco", "funk", "reggaeton"],
        "sad": ["acoustic", "folk", "singer-songwriter", "indie", "piano"],
        "angry": ["metal", "hard-rock", "punk", "grunge", "nu-metal"],
        "relaxed": ["chill", "ambient", "classical", "jazz", "lofi"],
        "energetic": ["electronic", "dance", "house", "techno", "edm"]
    }
    
    genres = emotion_to_genres.get(emotion.lower(), ["pop"])
    
    all_tracks = []
    seen_track_names = set()
    
    # Buscar en cada género
    for genre in genres:
        if len(all_tracks) >= 30:
            break
            
        search_query = f"genre:{genre}"
        params = {
            "q": search_query,
            "type": "track",
            "limit": 20,
        }

        url = f"{SPOTIFY_API_BASE_URL}/search"
        
        try:
            response = requests.get(url, headers=headers, params=params)


            if response.status_code == 401:
                return {
                    "error": "token_expired",
                    "message": "El token de acceso ha caducado",
                    "status_code": 401,
                    "tracks": [],
                    "emotion": emotion
                }
            
            if response.status_code == 200:
                data = response.json()
                tracks = data.get("tracks", {}).get("items", [])
                
                # Ordenar por popularidad y tomar las mejores
                sorted_tracks = sorted(tracks, key=lambda x: x.get('popularity', 0), reverse=True)
                
                for track in sorted_tracks:
                    if len(all_tracks) >= 30:
                        break
                        
                    track_name = track.get("name", "").lower().strip()
                    
                    if track_name and track_name not in seen_track_names:
                        seen_track_names.add(track_name)
                        
                        artists = [{"name": artist.get("name")} for artist in track.get("artists", [])[:2]]
                        
                        all_tracks.append({
                            "name": track.get("name"),
                            "artists": artists,
                            "album": {
                                "name": track.get("album", {}).get("name"),
                                "images": track.get("album", {}).get("images", [])
                            },
                            "external_urls": track.get("external_urls", {}),
                            "preview_url": track.get("preview_url"),
                            "uri": track.get("uri"),
                            "duration_ms": track.get("duration_ms"),
                            "popularity": track.get("popularity", 0),
                            "genre": genre
                        })
                            
        except Exception as e:
            print(f"⚠️ Error en búsqueda de respaldo: {e}")
            continue
    
    # Si encontramos tracks en el respaldo, mezclarlos
    if all_tracks:
        import random
        random.shuffle(all_tracks)
        selected_tracks = all_tracks[:30]
        
        return {
            "tracks": selected_tracks,
            "emotion": emotion,
            "total_tracks": len(selected_tracks),
            "search_method": "fallback_genre_based",
            "note": f"30 canciones de géneros asociados a {emotion} (respaldo)",
            "genres_used": genres
        }
    
    # Último recurso
    return {
        "tracks": [],
        "emotion": emotion,
        "total_tracks": 0,
        "search_method": "error",
        "note": "No se pudieron obtener recomendaciones"
    }