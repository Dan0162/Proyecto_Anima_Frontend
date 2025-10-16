from fastapi import APIRouter, HTTPException, status, Header, UploadFile, File
from pydantic import BaseModel
from typing import Dict
import random
import base64
import io
from PIL import Image

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
    """
    🎭 Análisis de emoción desde imagen Base64 (MOCKUP)
    
    Este endpoint simula el análisis de emociones sin usar AWS Rekognition.
    Perfecto para desarrollo y pruebas.
    """
    try:
        # Verificar autenticación
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
        
        # Validar formato de imagen
        is_valid = validate_image_base64(request.image)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de imagen inválido. Use JPEG, PNG o WebP."
            )
        
        # 🎲 Seleccionar emoción aleatoria (MOCKUP)
        emotion_key = random.choice(list(MOCK_EMOTIONS.keys()))
        emotion_data = MOCK_EMOTIONS[emotion_key].copy()
        
        # Agregar timestamp
        from datetime import datetime
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