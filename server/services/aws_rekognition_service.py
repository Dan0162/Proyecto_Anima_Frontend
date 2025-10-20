import boto3
from botocore.exceptions import BotoCoreError, ClientError
from server.core.config import settings
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class AWSRekognitionService:
    def __init__(self):
        try:
            self.client = boto3.client(
                'rekognition',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.default_max_labels = settings.AWS_REKOGNITION_MAX_LABELS
            self.default_min_confidence = settings.AWS_REKOGNITION_MIN_CONFIDENCE
            self.default_similarity_threshold = settings.AWS_REKOGNITION_SIMILARITY_THRESHOLD
            logger.info("AWS Rekognition service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AWS Rekognition: {str(e)}")
            raise
    
    async def detect_faces(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Detecta caras en una imagen con todos los atributos
        """
        try:
            response = self.client.detect_faces(
                Image={'Bytes': image_bytes},
                Attributes=['ALL']  # O puedes usar ['DEFAULT'] para menos atributos
            )
            
            face_details = []
            for face in response['FaceDetails']:
                face_details.append({
                    "bounding_box": face.get('BoundingBox', {}),
                    "age_range": face.get('AgeRange', {}),
                    "smile": face.get('Smile', {}),
                    "eyeglasses": face.get('Eyeglasses', {}),
                    "sunglasses": face.get('Sunglasses', {}),
                    "gender": face.get('Gender', {}),
                    "beard": face.get('Beard', {}),
                    "mustache": face.get('Mustache', {}),
                    "eyes_open": face.get('EyesOpen', {}),
                    "mouth_open": face.get('MouthOpen', {}),
                    "emotions": face.get('Emotions', []),
                    "confidence": face.get('Confidence', 0)
                })
            
            return {
                "success": True,
                "face_count": len(response['FaceDetails']),
                "faces": face_details,
                "raw_response": response  # Opcional: incluir respuesta completa
            }
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return {
                "success": False,
                "error": f"AWS Rekognition Error: {str(e)}",
                "face_count": 0,
                "faces": []
            }
    
    async def detect_labels(self, image_bytes: bytes, max_labels: Optional[int] = None, min_confidence: Optional[float] = None) -> Dict[str, Any]:
        """
        Detecta etiquetas/objetos en una imagen
        """
        try:
            response = self.client.detect_labels(
                Image={'Bytes': image_bytes},
                MaxLabels=max_labels or self.default_max_labels,
                MinConfidence=min_confidence or self.default_min_confidence
            )
            
            labels = []
            for label in response['Labels']:
                labels.append({
                    "name": label['Name'],
                    "confidence": label['Confidence'],
                    "instances": len(label.get('Instances', [])),
                    "parents": [parent['Name'] for parent in label.get('Parents', [])]
                })
            
            return {
                "success": True,
                "label_count": len(response['Labels']),
                "labels": labels,
                "raw_response": response
            }
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error detecting labels: {str(e)}")
            return {
                "success": False,
                "error": f"AWS Rekognition Error: {str(e)}",
                "label_count": 0,
                "labels": []
            }
    
    async def detect_text(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Detecta texto en una imagen
        """
        try:
            response = self.client.detect_text(
                Image={'Bytes': image_bytes}
            )
            
            text_detections = []
            for detection in response['TextDetections']:
                text_detections.append({
                    "text": detection['DetectedText'],
                    "type": detection['Type'],
                    "confidence": detection.get('Confidence', 0),
                    "bounding_box": detection.get('Geometry', {}).get('BoundingBox', {}) if detection.get('Geometry') else {}
                })
            
            return {
                "success": True,
                "text_count": len(response['TextDetections']),
                "text_detections": text_detections,
                "raw_response": response
            }
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error detecting text: {str(e)}")
            return {
                "success": False,
                "error": f"AWS Rekognition Error: {str(e)}",
                "text_count": 0,
                "text_detections": []
            }
    
    async def compare_faces(self, source_image_bytes: bytes, target_image_bytes: bytes, similarity_threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Compara caras entre dos imágenes
        """
        try:
            response = self.client.compare_faces(
                SourceImage={'Bytes': source_image_bytes},
                TargetImage={'Bytes': target_image_bytes},
                SimilarityThreshold=similarity_threshold or self.default_similarity_threshold
            )
            
            matches = []
            for match in response['FaceMatches']:
                matches.append({
                    "similarity": match['Similarity'],
                    "bounding_box": match['Face'].get('BoundingBox', {}),
                    "confidence": match['Face'].get('Confidence', 0)
                })
            
            # Caras que no coincidieron
            unmatched_faces = []
            for face in response.get('UnmatchedFaces', []):
                unmatched_faces.append({
                    "bounding_box": face.get('BoundingBox', {}),
                    "confidence": face.get('Confidence', 0)
                })
            
            return {
                "success": True,
                "match_count": len(response['FaceMatches']),
                "matches": matches,
                "unmatched_faces": unmatched_faces,
                "source_face_count": len(response.get('SourceImageFace', {})),
                "raw_response": response
            }
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error comparing faces: {str(e)}")
            return {
                "success": False,
                "error": f"AWS Rekognition Error: {str(e)}",
                "match_count": 0,
                "matches": [],
                "unmatched_faces": []
            }
    
    async def detect_moderation_labels(self, image_bytes: bytes, min_confidence: Optional[float] = None) -> Dict[str, Any]:
        """
        Detecta contenido inapropiado en imágenes
        """
        try:
            response = self.client.detect_moderation_labels(
                Image={'Bytes': image_bytes},
                MinConfidence=min_confidence or self.default_min_confidence
            )
            
            moderation_labels = []
            for label in response['ModerationLabels']:
                moderation_labels.append({
                    "name": label['Name'],
                    "confidence": label['Confidence'],
                    "parent_name": label.get('ParentName', ''),
                    "category": label.get('ParentName', '')  # Categoría principal
                })
            
            return {
                "success": True,
                "has_inappropriate_content": len(response['ModerationLabels']) > 0,
                "moderation_labels": moderation_labels,
                "inappropriate_score": max([label['Confidence'] for label in moderation_labels]) if moderation_labels else 0,
                "raw_response": response
            }
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error detecting moderation labels: {str(e)}")
            return {
                "success": False,
                "error": f"AWS Rekognition Error: {str(e)}",
                "has_inappropriate_content": False,
                "moderation_labels": [],
                "inappropriate_score": 0
            }

# Instancia global del servicio
rekognition_service = AWSRekognitionService()