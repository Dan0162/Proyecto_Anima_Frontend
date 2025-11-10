from fastapi import APIRouter, HTTPException, status, Header, UploadFile, File
from pydantic import BaseModel
from typing import Dict
import random
import base64
import io
from PIL import Image
from server.services.aws_rekognition_service import rekognition_service
from server.core.config import settings
from botocore.exceptions import BotoCoreError, ClientError
from datetime import datetime
from server.core.security import verify_token
from server.db.models.user import User
from server.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/v1/analysis", tags=["analysis"])

class ImageBase64Request(BaseModel):
    image: str  # Base64 string

class EmotionAnalysisResponse(BaseModel):
    emotion: str
    confidence: float
    emotions_detected: Dict[str, float]
    timestamp: str
    message: str

# 🎭 Datos mockup de emociones
MOCK_EMOTIONS = {
    "happy": {
        "emotion": "happy",
        "confidence": 0.87,
        "emotions_detected": {
            "happy": 0.87,
            "relaxed": 0.06,
            "sad": 0.03,
            "angry": 0.02,
            "energetic": 0.02
        }
    },
    "sad": {
        "emotion": "sad",
        "confidence": 0.82,
        "emotions_detected": {
            "sad": 0.82,
            "relaxed": 0.09,
            "happy": 0.05,
            "angry": 0.03,
            "energetic": 0.01
        }
    },
    "angry": {
        "emotion": "angry",
        "confidence": 0.79,
        "emotions_detected": {
            "angry": 0.79,
            "energetic": 0.11,
            "sad": 0.06,
            "happy": 0.03,
            "relaxed": 0.01
        }
    },
    "relaxed": {
        "emotion": "relaxed",
        "confidence": 0.85,
        "emotions_detected": {
            "relaxed": 0.85,
            "happy": 0.08,
            "sad": 0.04,
            "angry": 0.02,
            "energetic": 0.01
        }
    },
    "energetic": {
        "emotion": "energetic",
        "confidence": 0.83,
        "emotions_detected": {
            "energetic": 0.83,
            "happy": 0.09,
            "angry": 0.04,
            "relaxed": 0.03,
            "sad": 0.01
        }
    }
}

def validate_image_base64(image_data: str) -> bool:
    """
    Valida que la imagen en base64 sea válida
    """
    try:
        # Remover el prefijo data:image si existe
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decodificar base64
        image_bytes = base64.b64decode(image_data)
        
        # Intentar abrir como imagen
        image = Image.open(io.BytesIO(image_bytes))
        
        # Verificar que sea una imagen válida
        image.verify()
        
        return True
    except Exception as e:
        print(f"❌ Error validando imagen: {e}")
        return False

@router.post("/analyze-base64", response_model=EmotionAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_emotion_base64(
    request: ImageBase64Request,
    authorization: str = Header(..., alias="Authorization")
):
    try:
        # Verifica autenticación
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o ausente"
            )
        
        # Validar imagen
        if not request.image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionó ninguna imagen"
            )

        # Remover prefijo data:image si existe y decodificar
        image_data = request.image
        if ',' in image_data:
            image_data = image_data.split(',')[1]

        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen inválido (no es Base64)."
            )

        # Validar que sea una imagen válida
        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen inválido. Use JPEG, PNG o WebP."
            )

        # If AWS credentials are configured, try to use Rekognition. Otherwise fallback to mockup.
        use_aws = bool(getattr(settings, 'AWS_ACCESS_KEY_ID', None) and getattr(settings, 'AWS_SECRET_ACCESS_KEY', None))

        # Mapping from AWS Rekognition emotion types to our app emotion keys
        aws_to_app = {
            'HAPPY': 'happy',
            'SAD': 'sad',
            'ANGRY': 'angry',
            'CALM': 'relaxed',
            'SURPRISED': 'energetic',
            'CONFUSED': 'relaxed',
            'DISGUSTED': 'angry',
            'FEAR': 'sad'
        }

        from datetime import datetime

        if use_aws:
            try:
                # Call Rekognition detect_faces
                result = await rekognition_service.detect_faces(image_bytes)

                if not result.get('success'):
                    # Fallback to mockup if AWS call failed
                    raise Exception(result.get('error', 'AWS Rekognition returned an error'))

                faces = result.get('faces', [])
                if not faces:
                    # No faces detected -> fallback to mockup
                    raise Exception('No faces detected')

                # Use first face for emotion analysis
                emotions_list = faces[0].get('emotions', [])

                # Convert to dictionary and normalize confidences to 0..1
                emotions_detected = {}
                for e in emotions_list:
                    typ = e.get('Type') or e.get('type') or e.get('emotion')
                    conf = e.get('Confidence') or e.get('confidence') or 0.0
                    conf = float(conf) / 100.0
                    key = aws_to_app.get(typ.upper(), typ.lower() if isinstance(typ, str) else str(typ))
                    if key in emotions_detected:
                        emotions_detected[key] += conf
                    else:
                        emotions_detected[key] = conf

                # Normalize after mapping and summing
                mapped_total = sum(emotions_detected.values())
                if mapped_total > 0:
                    for k in list(emotions_detected.keys()):
                        emotions_detected[k] = round(emotions_detected[k] / mapped_total, 3)

                # Pick top emotion by normalized value
                if emotions_detected:
                    app_top = max(emotions_detected, key=lambda k: emotions_detected[k])
                    top_conf = emotions_detected[app_top]
                else:
                    app_top = None
                    top_conf = 0.0

                emotion_data = {
                    'emotion': app_top,
                    'confidence': round(top_conf, 4),
                    'emotions_detected': emotions_detected,
                    'timestamp': datetime.utcnow().isoformat(),
                    'message': 'Análisis completado exitosamente (AWS Rekognition)'
                }

                print(f"✅ Análisis Rekognition: {app_top} ({emotion_data['confidence']*100:.1f}%)")
                return EmotionAnalysisResponse(**emotion_data)

            except (BotoCoreError, ClientError) as be:
                print(f"❌ AWS Rekognition error: {be}")
                # Fallthrough to mockup
            except Exception as e:
                print(f"❌ Rekognition processing error: {e}")
                # Fallthrough to mockup

        # If we reach here, use mockup behavior (previous implementation)
        emotion_key = random.choice(list(MOCK_EMOTIONS.keys()))
        emotion_data = MOCK_EMOTIONS[emotion_key].copy()
        emotion_data["timestamp"] = datetime.utcnow().isoformat()
        emotion_data["message"] = f"Análisis completado exitosamente (modo mockup)"
        print(f"✅ Análisis mockup: {emotion_key} ({emotion_data['confidence']*100:.1f}%)")
        return EmotionAnalysisResponse(**emotion_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en análisis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando la imagen. Por favor, intenta nuevamente."
        )


@router.post("/analyze", response_model=EmotionAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_emotion_file(
    image: UploadFile = File(...),
    authorization: str = Header(..., alias="Authorization")
):
    """
    🎭 Análisis de emoción desde archivo de imagen (MOCKUP)
    
    Alternativa para subir archivos directamente en lugar de Base64.
    """
    try:
        # Verificar autenticación
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o ausente"
            )
        
        # Validar tipo de archivo
        if not image.content_type or not image.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser una imagen (JPEG, PNG, WebP)"
            )
        
        # Leer contenido
        contents = await image.read()
        
        # Validar que sea una imagen válida
        try:
            img = Image.open(io.BytesIO(contents))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Archivo de imagen corrupto o inválido"
            )
        
        # 🎲 Seleccionar emoción aleatoria (MOCKUP)
        emotion_key = random.choice(list(MOCK_EMOTIONS.keys()))
        emotion_data = MOCK_EMOTIONS[emotion_key].copy()
        
        # Agregar timestamp
        from datetime import datetime
        emotion_data["timestamp"] = datetime.utcnow().isoformat()
        emotion_data["message"] = f"Análisis completado exitosamente (modo mockup)"
        
        print(f"✅ Análisis mockup (file): {emotion_key} ({emotion_data['confidence']*100:.1f}%)")
        
        return EmotionAnalysisResponse(**emotion_data)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en análisis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error procesando la imagen. Por favor, intenta nuevamente."
        )


@router.get("/test", status_code=status.HTTP_200_OK)
async def test_analysis():
    """
    🧪 Endpoint de prueba para verificar que el servicio funciona
    """
    return {
        "status": "ok",
        "message": "Servicio de análisis funcionando (modo mockup)",
        "available_emotions": list(MOCK_EMOTIONS.keys()),
        "note": "Este es un servicio mockup para desarrollo. No usa AWS Rekognition."
    }