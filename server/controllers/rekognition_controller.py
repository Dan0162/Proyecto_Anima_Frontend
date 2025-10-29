from fastapi import APIRouter, UploadFile, File, HTTPException
from server.services.aws_rekognition_service import rekognition_service
from server.schemas.rekognition import (
    FaceDetectionResponse,
    LabelDetectionResponse,
    TextDetectionResponse,
    FaceComparisonResponse,
    ModerationDetectionResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rekognition", tags=["AWS Rekognition"])

@router.post("/detect-faces", response_model=FaceDetectionResponse)
async def detect_faces(file: UploadFile = File(...)):
    """
    Detecta caras en una imagen
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await file.read()
        
        result = await rekognition_service.detect_faces(image_bytes)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return FaceDetectionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in detect_faces: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-labels", response_model=LabelDetectionResponse)
async def detect_labels(file: UploadFile = File(...)):
    """
    Detecta etiquetas/objetos en una imagen
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await file.read()
        
        # ✅ CORREGIDO: Agregar AWAIT aquí
        result = await rekognition_service.detect_labels(image_bytes)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return LabelDetectionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in detect_labels: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-text", response_model=TextDetectionResponse)
async def detect_text(file: UploadFile = File(...)):
    """
    Detecta texto en una imagen
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await file.read()
        
    
        result = await rekognition_service.detect_text(image_bytes)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return TextDetectionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in detect_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/compare-faces", response_model=FaceComparisonResponse)
async def compare_faces(
    source_file: UploadFile = File(...),
    target_file: UploadFile = File(...)
):
    """
    Compara caras entre dos imágenes
    """
    try:
        if not source_file.content_type.startswith('image/') or not target_file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Both files must be images")
        
        source_bytes = await source_file.read()
        target_bytes = await target_file.read()
        
        # ✅ CORREGIDO: Agregar AWAIT aquí
        result = await rekognition_service.compare_faces(source_bytes, target_bytes)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return FaceComparisonResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in compare_faces: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-moderation", response_model=ModerationDetectionResponse)
async def detect_moderation(file: UploadFile = File(...)):
    """
    Detecta contenido inapropiado en imágenes
    """
    try:
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        image_bytes = await file.read()
        
       
        result = await rekognition_service.detect_moderation_labels(image_bytes)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return ModerationDetectionResponse(**result)
    
    except Exception as e:
        logger.error(f"Error in detect_moderation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))