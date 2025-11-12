from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import List, Optional
import requests
import json
from server.core.security import verify_token
from datetime import datetime
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.db.models.user import User
from server.db.models.session import Session as UserSession
from server.db.models.analysis import Analysis

router = APIRouter(prefix="/v1/spotify", tags=["spotify"])

class CreatePlaylistRequest(BaseModel):
    analysis_id: int
    emotion: str
    confidence: float
    tracks: List[str]  # Lista de URIs de Spotify

class CreatePlaylistResponse(BaseModel):
    success: bool
    playlist_id: str
    playlist_name: str
    playlist_url: str
    tracks_added: int
    message: str

def get_spotify_user_info(access_token: str):
    """Obtiene información del usuario de Spotify"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get("https://api.spotify.com/v1/me", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise HTTPException(
            status_code=401,
            detail="Token de Spotify inválido o expirado"
        )

def create_spotify_playlist(access_token: str, user_id: str, name: str, description: str):
    """Crea una playlist en Spotify"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    data = {
        "name": name,
        "description": description,
        "public": False
    }
    
    response = requests.post(
        f"https://api.spotify.com/v1/users/{user_id}/playlists",
        headers=headers,
        json=data
    )
    
    if response.status_code == 201:
        return response.json()
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Error creando playlist: {response.text}"
        )

def add_tracks_to_playlist(access_token: str, playlist_id: str, track_uris: List[str]):
    """Agrega tracks a una playlist de Spotify"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    # Spotify permite máximo 100 tracks por request
    track_batches = [track_uris[i:i+100] for i in range(0, len(track_uris), 100)]
    total_added = 0
    
    for batch in track_batches:
        data = {"uris": batch}
        
        response = requests.post(
            f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks",
            headers=headers,
            json=data
        )
        
        if response.status_code == 201:
            total_added += len(batch)
        else:
            print(f"Error agregando batch de tracks: {response.text}")
            break
    
    return total_added

@router.post("/create-playlist", response_model=CreatePlaylistResponse)
async def create_analysis_playlist(
    request: CreatePlaylistRequest,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Crea una playlist en Spotify basada en un análisis de emoción
    """
    try:
        # Verificar que tenemos un JWT de Spotify
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token de autorización requerido"
            )
        
        token = authorization.split(" ")[1]
        
        # Decodificar el JWT y extraer el access token de Spotify
        try:
            payload = verify_token(token)
            spotify_info = payload.get('spotify')

            if not spotify_info or not spotify_info.get('access_token'):
                raise HTTPException(
                    status_code=401,
                    detail="Token de Spotify no encontrado. Conecta tu cuenta de Spotify."
                )

            spotify_access_token = spotify_info.get('access_token')

        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Token inválido o expirado"
            )
        
        # Obtener información del usuario de Spotify
        user_info = get_spotify_user_info(spotify_access_token)
        user_id = user_info.get('id')
        display_name = user_info.get('display_name', 'Usuario')
        
        # Generar nombre y descripción de la playlist
        emotion_labels = {
            'happy': 'Feliz',
            'sad': 'Triste',
            'angry': 'Enojado',
            'relaxed': 'Relajado',
            'energetic': 'Energético'
        }
        
        emotion_label = emotion_labels.get(request.emotion, request.emotion.title())
        confidence_percent = int(request.confidence * 100)
        
        playlist_name = f"Ánima - {emotion_label} ({confidence_percent}%)"
        
        current_date = datetime.now().strftime("%d/%m/%Y")
        playlist_description = (
            f"Playlist generada por Ánima basada en tu análisis emocional del {current_date}. "
            f"Emoción detectada: {emotion_label} con {confidence_percent}% de confianza. "
            f"🎵 Música que refleja cómo te sentís."
        )
        
        # Crear la playlist
        playlist_data = create_spotify_playlist(
            spotify_access_token,
            user_id,
            playlist_name,
            playlist_description
        )
        
        playlist_id = playlist_data.get('id')
        playlist_url = playlist_data.get('external_urls', {}).get('spotify', '')
        
        # Filtrar tracks válidos (eliminar None y vacíos)
        valid_tracks = [uri for uri in request.tracks if uri and uri.startswith('spotify:track:')]
        
        tracks_added = 0
        if valid_tracks:
            # Agregar tracks a la playlist
            tracks_added = add_tracks_to_playlist(
                spotify_access_token,
                playlist_id,
                valid_tracks
            )
        
        if tracks_added == 0:
            # Si no se pudieron agregar tracks, eliminar la playlist vacía
            delete_response = requests.delete(
                f"https://api.spotify.com/v1/playlists/{playlist_id}/followers",
                headers={"Authorization": f"Bearer {spotify_access_token}"}
            )
            
            raise HTTPException(
                status_code=400,
                detail="No se pudieron agregar canciones válidas a la playlist"
            )
        # Intentar persistir metadata de playlist dentro del análisis (si existe)
        try:
            if request.analysis_id:
                # Verificar que el análisis pertenezca al usuario que hace la petición
                # Obtener email del JWT
                payload = verify_token(token)
                email = payload.get('sub')
                user = db.query(User).filter(User.email == email).first()
                if user:
                    # Verificar que la sesión asociada al análisis pertenece al usuario
                    analysis_obj = db.query(Analysis).filter(Analysis.id == request.analysis_id).first()
                    if analysis_obj:
                        session_obj = db.query(UserSession).filter(UserSession.id == analysis_obj.id_sesion, UserSession.id_usuario == user.id).first()
                        if session_obj:
                            # Actualizar recommendations (mantener estructura existente)
                            recs = analysis_obj.recommendations or {}
                            if isinstance(recs, list):
                                # Convertir lista a dict con key 'tracks' para almacenar playlist metadata
                                recs = { 'tracks': recs }
                            recs['playlist'] = {
                                'id': playlist_id,
                                'name': playlist_name,
                                'url': playlist_url,
                                'tracks_added': tracks_added
                            }
                            analysis_obj.recommendations = recs
                            db.add(analysis_obj)
                            db.commit()
        except Exception as e:
            # No bloquear la creación de playlist por errores de persistencia en BD
            print(f"⚠️ Error guardando metadata de playlist en BD: {e}")

        return CreatePlaylistResponse(
            success=True,
            playlist_id=playlist_id,
            playlist_name=playlist_name,
            playlist_url=playlist_url,
            tracks_added=tracks_added,
            message=f"Playlist '{playlist_name}' creada exitosamente con {tracks_added} canciones"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creando playlist: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno al crear la playlist"
        )

@router.get("/user-info")
async def get_user_info(
    authorization: str = Header(..., alias="Authorization")
):
    """
    Obtiene información del usuario conectado de Spotify
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token de autorización requerido"
            )
        
        token = authorization.split(" ")[1]
        
        # Decodificar el JWT y extraer el access token de Spotify
        try:
            payload = verify_token(token)
            spotify_info = payload.get('spotify')
            
            if not spotify_info or not spotify_info.get('access_token'):
                raise HTTPException(
                    status_code=401,
                    detail="Token de Spotify no encontrado"
                )
            
            spotify_access_token = spotify_info.get('access_token')
            
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Token inválido o expirado"
            )
        
        # Obtener información del usuario
        user_info = get_spotify_user_info(spotify_access_token)
        
        return {
            "success": True,
            "user": {
                "id": user_info.get('id'),
                "display_name": user_info.get('display_name'),
                "email": user_info.get('email'),
                "followers": user_info.get('followers', {}).get('total', 0),
                "country": user_info.get('country'),
                "product": user_info.get('product'),
                "images": user_info.get('images', [])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error obteniendo info del usuario: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error obteniendo información del usuario"
        )

@router.get("/playlists")
async def get_user_playlists(
    authorization: str = Header(..., alias="Authorization"),
    limit: int = 20
):
    """
    Obtiene las playlists del usuario de Spotify
    """
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token de autorización requerido"
            )
        
        token = authorization.split(" ")[1]
        
        # Decodificar el JWT y extraer el access token de Spotify
        try:
            payload = verify_token(token)
            spotify_info = payload.get('spotify')
            
            if not spotify_info or not spotify_info.get('access_token'):
                raise HTTPException(
                    status_code=401,
                    detail="Token de Spotify no encontrado"
                )
            
            spotify_access_token = spotify_info.get('access_token')
            
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Token inválido o expirado"
            )
        
        # Obtener playlists del usuario
        headers = {"Authorization": f"Bearer {spotify_access_token}"}
        response = requests.get(
            f"https://api.spotify.com/v1/me/playlists?limit={limit}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            playlists = []
            for playlist in data.get('items', []):
                playlists.append({
                    "id": playlist.get('id'),
                    "name": playlist.get('name'),
                    "description": playlist.get('description'),
                    "tracks_total": playlist.get('tracks', {}).get('total', 0),
                    "public": playlist.get('public'),
                    "url": playlist.get('external_urls', {}).get('spotify'),
                    "images": playlist.get('images', [])
                })
            
            return {
                "success": True,
                "playlists": playlists,
                "total": data.get('total', 0)
            }
        else:
            raise HTTPException(
                status_code=400,
                detail="Error obteniendo playlists de Spotify"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error obteniendo playlists: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error obteniendo playlists del usuario"
        )