from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from decimal import Decimal

class FaceDetectionResponse(BaseModel):
    success: bool
    face_count: int
    faces: List[Dict[str, Any]]
    error: Optional[str] = None

class LabelDetectionResponse(BaseModel):
    success: bool
    label_count: int
    labels: List[Dict[str, Any]]
    error: Optional[str] = None

class TextDetectionResponse(BaseModel):
    success: bool
    text_count: int
    text_detections: List[Dict[str, Any]]
    error: Optional[str] = None

class FaceComparisonResponse(BaseModel):
    success: bool
    match_count: int
    matches: List[Dict[str, Any]]
    unmatched_faces: List[Dict[str, Any]]
    source_face_count: int
    error: Optional[str] = None

class ModerationDetectionResponse(BaseModel):
    success: bool
    has_inappropriate_content: bool
    moderation_labels: List[Dict[str, Any]]
    inappropriate_score: float
    error: Optional[str] = None

# Schemas para requests con valores por defecto de la configuración
class DetectionParams(BaseModel):
    max_labels: Optional[int] = None
    min_confidence: Optional[float] = None
    similarity_threshold: Optional[float] = None