from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.core.security import verify_token
from server.db.models.user import User
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from jose import JWTError
from pydantic import BaseModel
from typing import Dict, List, Optional

router = APIRouter(prefix="/v1/analytics", tags=["analytics"])

class EmotionStats(BaseModel):
    emotion: str
    count: int
    percentage: float

class WeeklyActivity(BaseModel):
    day: str
    analyses_count: int

class UserStats(BaseModel):
    total_analyses: int
    most_frequent_emotion: Optional[str]
    average_confidence: float
    streak: int
    emotions_distribution: List[EmotionStats]
    weekly_activity: List[WeeklyActivity]

class AnalysisHistory(BaseModel):
    id: str
    emotion: str
    confidence: float
    date: datetime
    emotions_detected: Dict[str, float]

class AnalysisHistoryResponse(BaseModel):
    analyses: List[AnalysisHistory]
    total: int

# Simulación temporal de datos hasta implementar almacenamiento real
MOCK_USER_ANALYSES = {}

def get_current_user(authorization: str, db: Session):
    """Helper para obtener usuario actual"""
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Formato de token inválido")
        
        token = authorization.split(" ")[1]
        payload = verify_token(token)
        email = payload.get("sub")
        
        if not email:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        return user
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

@router.get("/stats", response_model=UserStats)
def get_user_stats(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas del usuario para el dashboard
    """
    user = get_current_user(authorization, db)
    
    # TODO: Reemplazar con datos reales de la base de datos
    # Por ahora devolvemos estructura vacía para nuevos usuarios
    user_analyses = MOCK_USER_ANALYSES.get(user.id, [])
    
    if not user_analyses:
        # Usuario sin análisis - datos iniciales
        return UserStats(
            total_analyses=0,
            most_frequent_emotion=None,
            average_confidence=0.0,
            streak=0,
            emotions_distribution=[],
            weekly_activity=[
                WeeklyActivity(day="Lun", analyses_count=0),
                WeeklyActivity(day="Mar", analyses_count=0),
                WeeklyActivity(day="Mié", analyses_count=0),
                WeeklyActivity(day="Jue", analyses_count=0),
                WeeklyActivity(day="Vie", analyses_count=0),
                WeeklyActivity(day="Sáb", analyses_count=0),
                WeeklyActivity(day="Dom", analyses_count=0),
            ]
        )

    
    # Calcular estadísticas reales basadas en análisis almacenados
    total_analyses = len(user_analyses)
    
    # Emoción más frecuente
    emotion_counts = {}
    total_confidence = 0
    
    for analysis in user_analyses:
        emotion = analysis["emotion"]
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        total_confidence += analysis["confidence"]
    
    most_frequent_emotion = max(emotion_counts, key=emotion_counts.get) if emotion_counts else None
    average_confidence = total_confidence / total_analyses if total_analyses > 0 else 0
    
    # Distribución de emociones
    emotions_distribution = []
    for emotion, count in emotion_counts.items():
        percentage = (count / total_analyses) * 100
        emotions_distribution.append(EmotionStats(
            emotion=emotion,
            count=count,
            percentage=percentage
        ))
    
    # Actividad semanal (últimos 7 días)
    weekly_activity = []
    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    
    # Actividad por hora del día (24 horas)
    hourly_activity = [0] * 24
    for analysis in user_analyses:
        hour = analysis["date"].hour if isinstance(analysis["date"], datetime) else 0
        if 0 <= hour < 24:
            hourly_activity[hour] += 1

    for i, day in enumerate(days):
        # Calcular análisis reales por día de la semana
        count = sum(1 for analysis in user_analyses[-7:] if analysis.get("day_of_week") == i)
        weekly_activity.append(WeeklyActivity(day=day, analyses_count=count))
    
    # Calcular racha
    streak = calculate_streak(user_analyses)
    
    return UserStats(
        total_analyses=total_analyses,
        most_frequent_emotion=most_frequent_emotion,
        average_confidence=average_confidence,
        streak=streak,
        emotions_distribution=emotions_distribution,
        weekly_activity=weekly_activity
    )

@router.get("/history", response_model=AnalysisHistoryResponse)
def get_user_history(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
    emotion_filter: Optional[str] = None
):
    """
    Obtiene el historial de análisis del usuario
    """
    user = get_current_user(authorization, db)
    
    # TODO: Obtener datos reales de la base de datos
    user_analyses = MOCK_USER_ANALYSES.get(user.id, [])
    
    # Filtrar por emoción si se especifica
    if emotion_filter:
        user_analyses = [a for a in user_analyses if a["emotion"] == emotion_filter]
    
    # Convertir a formato de respuesta
    analyses = []
    for analysis in user_analyses:
        analyses.append(AnalysisHistory(
            id=analysis["id"],
            emotion=analysis["emotion"],
            confidence=analysis["confidence"],
            date=analysis["date"],
            emotions_detected=analysis.get("emotions_detected", {})
        ))
    
    # Ordenar por fecha descendente
    analyses.sort(key=lambda x: x.date, reverse=True)
    
    return AnalysisHistoryResponse(
        analyses=analyses,
        total=len(analyses)
    )

@router.post("/save-analysis")
def save_analysis_result(
    analysis_data: dict,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Guarda el resultado de un análisis de emoción
    """
    user = get_current_user(authorization, db)
    
    # TODO: Guardar en base de datos real
    # Por ahora guardamos en memoria
    if user.id not in MOCK_USER_ANALYSES:
        MOCK_USER_ANALYSES[user.id] = []
    
    # Crear entrada de análisis
    analysis_entry = {
        "id": f"analysis_{len(MOCK_USER_ANALYSES[user.id]) + 1}",
        "emotion": analysis_data.get("emotion"),
        "confidence": analysis_data.get("confidence"),
        "emotions_detected": analysis_data.get("emotions_detected", {}),
        "date": datetime.utcnow(),
        "day_of_week": datetime.utcnow().weekday()
    }
    
    MOCK_USER_ANALYSES[user.id].append(analysis_entry)
    
    return {"message": "Análisis guardado exitosamente", "success": True}

def calculate_streak(analyses: List[dict]) -> int:
    """Calcula la racha de días consecutivos con análisis"""
    if not analyses:
        return 0
    
    # Ordenar por fecha
    sorted_analyses = sorted(analyses, key=lambda x: x["date"], reverse=True)
    
    # Contar días únicos consecutivos
    streak = 0
    current_date = datetime.utcnow().date()
    
    for analysis in sorted_analyses:
        analysis_date = analysis["date"].date() if isinstance(analysis["date"], datetime) else analysis["date"]
        
        if analysis_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak