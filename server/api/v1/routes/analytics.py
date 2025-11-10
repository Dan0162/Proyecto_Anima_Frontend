from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.core.security import verify_token
from server.db.models.user import User
from server.db.models.session import Session as UserSession
from server.db.models.analysis import Analysis, Emotion
from sqlalchemy import func, desc, extract, and_
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

class WeeklyEmotionData(BaseModel):
    week_start: str
    emotions: Dict[str, int]

class UserStats(BaseModel):
    total_analyses: int
    most_frequent_emotion: Optional[str]
    average_confidence: float
    streak: int
    emotions_distribution: List[EmotionStats]
    weekly_activity: List[WeeklyActivity]
    hourly_activity: List[int]
    weekly_emotions: List[WeeklyEmotionData]
    positive_negative_balance: Dict[str, int]

class AnalysisHistory(BaseModel):
    id: str
    emotion: str
    confidence: float
    date: datetime
    emotions_detected: Dict[str, float]

class AnalysisHistoryResponse(BaseModel):
    analyses: List[AnalysisHistory]
    total: int

class AnalysisDetail(BaseModel):
    id: int
    emotion: str
    confidence: float
    date: datetime
    emotions_detected: Dict[str, float]
    session_id: int

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

def ensure_emotions_exist(db: Session):
    """Asegurar que las emociones básicas existan en la base de datos"""
    basic_emotions = ['happy', 'sad', 'angry', 'relaxed', 'energetic']
    
    for emotion_name in basic_emotions:
        existing = db.query(Emotion).filter(Emotion.nombre == emotion_name).first()
        if not existing:
            new_emotion = Emotion(nombre=emotion_name)
            db.add(new_emotion)
    
    db.commit()

@router.get("/stats", response_model=UserStats)
def get_user_stats(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas del usuario para el dashboard usando datos reales
    """
    user = get_current_user(authorization, db)
    ensure_emotions_exist(db)
    
    # Obtener todas las sesiones del usuario
    user_sessions = db.query(UserSession).filter(UserSession.id_usuario == user.id).all()
    session_ids = [session.id for session in user_sessions]
    
    if not session_ids:
        # Usuario sin sesiones - datos iniciales
        return create_empty_stats()
    
    # Obtener análisis reales de la base de datos
    analyses = db.query(Analysis, Emotion).join(
        Emotion, Analysis.id_emocion == Emotion.id
    ).filter(Analysis.id_sesion.in_(session_ids)).all()
    
    if not analyses:
        return create_empty_stats()
    
    total_analyses = len(analyses)
    
    # Calcular estadísticas
    emotion_counts = {}
    total_confidence = 0
    hourly_counts = [0] * 24
    
    for analysis, emotion in analyses:
        emotion_name = emotion.nombre
        emotion_counts[emotion_name] = emotion_counts.get(emotion_name, 0) + 1
        total_confidence += analysis.confidence or 0
        
        # Actividad por hora
        hour = analysis.fecha_analisis.hour if analysis.fecha_analisis else 0
        if 0 <= hour < 24:
            hourly_counts[hour] += 1
    
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
    weekly_activity = calculate_weekly_activity(db, session_ids)
    
    # Emociones por semana (últimas 8 semanas)
    weekly_emotions = calculate_weekly_emotions(db, session_ids)
    
    # Balance positivo vs negativo
    positive_negative_balance = calculate_positive_negative_balance(emotion_counts)
    
    # Calcular racha
    streak = calculate_streak(db, session_ids)
    
    return UserStats(
        total_analyses=total_analyses,
        most_frequent_emotion=most_frequent_emotion,
        average_confidence=average_confidence,
        streak=streak,
        emotions_distribution=emotions_distribution,
        weekly_activity=weekly_activity,
        hourly_activity=hourly_counts,
        weekly_emotions=weekly_emotions,
        positive_negative_balance=positive_negative_balance
    )

@router.get("/analysis/{analysis_id}", response_model=AnalysisDetail)
def get_analysis_details(
    analysis_id: int,
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Obtiene los detalles de un análisis específico
    """
    user = get_current_user(authorization, db)
    
    # Obtener sesiones del usuario
    user_sessions = db.query(UserSession).filter(UserSession.id_usuario == user.id).all()
    session_ids = [session.id for session in user_sessions]
    
    if not session_ids:
        raise HTTPException(
            status_code=404,
            detail="No se encontraron sesiones para este usuario"
        )
    
    # Obtener el análisis específico
    analysis_result = db.query(Analysis, Emotion).join(
        Emotion, Analysis.id_emocion == Emotion.id
    ).filter(
        and_(
            Analysis.id == analysis_id,
            Analysis.id_sesion.in_(session_ids)
        )
    ).first()
    
    if not analysis_result:
        raise HTTPException(
            status_code=404,
            detail="Análisis no encontrado"
        )
    
    analysis, emotion = analysis_result
    
    return AnalysisDetail(
        id=analysis.id,
        emotion=emotion.nombre,
        confidence=analysis.confidence or 0.0,
        date=analysis.fecha_analisis,
        emotions_detected=analysis.emotions_detected or {},
        session_id=analysis.id_sesion
    )

def create_empty_stats():
    """Crear estadísticas vacías para usuarios nuevos"""
    return UserStats(
        total_analyses=0,
        most_frequent_emotion=None,
        average_confidence=0.0,
        streak=0,
        emotions_distribution=[],
        weekly_activity=[WeeklyActivity(day=day, analyses_count=0) for day in ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]],
        hourly_activity=[0] * 24,
        weekly_emotions=[],
        positive_negative_balance={"positive": 0, "negative": 0}
    )

def calculate_weekly_activity(db: Session, session_ids: List[int]) -> List[WeeklyActivity]:
    """Calcular actividad de los últimos 7 días"""
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())  # Lunes de esta semana
    
    daily_counts = {}
    days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    
    # Inicializar contadores
    for i, day in enumerate(days):
        daily_counts[i] = 0
    
    # Obtener análisis de la semana actual
    week_end = week_start + timedelta(days=6)
    analyses = db.query(Analysis).filter(
        and_(
            Analysis.id_sesion.in_(session_ids),
            Analysis.fecha_analisis >= week_start,
            Analysis.fecha_analisis <= week_end + timedelta(days=1)
        )
    ).all()
    
    # Contar por día de la semana
    for analysis in analyses:
        weekday = analysis.fecha_analisis.weekday()  # 0=Lunes, 6=Domingo
        if 0 <= weekday <= 6:
            daily_counts[weekday] += 1
    
    return [WeeklyActivity(day=days[i], analyses_count=daily_counts[i]) for i in range(7)]

def calculate_weekly_emotions(db: Session, session_ids: List[int]) -> List[WeeklyEmotionData]:
    """Calcular emociones por semana (últimas 8 semanas)"""
    today = datetime.now().date()
    weeks_data = []
    
    for week_offset in range(7, -1, -1):  # Últimas 8 semanas
        week_start = today - timedelta(days=today.weekday() + (week_offset * 7))
        week_end = week_start + timedelta(days=6)
        
        # Obtener análisis de esta semana
        analyses = db.query(Analysis, Emotion).join(
            Emotion, Analysis.id_emocion == Emotion.id
        ).filter(
            and_(
                Analysis.id_sesion.in_(session_ids),
                Analysis.fecha_analisis >= week_start,
                Analysis.fecha_analisis <= week_end + timedelta(days=1)
            )
        ).all()
        
        emotion_counts = {}
        for analysis, emotion in analyses:
            emotion_name = emotion.nombre
            emotion_counts[emotion_name] = emotion_counts.get(emotion_name, 0) + 1
        
        weeks_data.append(WeeklyEmotionData(
            week_start=week_start.strftime("%Y-%m-%d"),
            emotions=emotion_counts
        ))
    
    return weeks_data

def calculate_positive_negative_balance(emotion_counts: Dict[str, int]) -> Dict[str, int]:
    """Calcular balance de emociones positivas vs negativas"""
    positive_emotions = ['happy', 'energetic', 'relaxed']
    negative_emotions = ['sad', 'angry']
    
    positive_count = sum(emotion_counts.get(emotion, 0) for emotion in positive_emotions)
    negative_count = sum(emotion_counts.get(emotion, 0) for emotion in negative_emotions)
    
    return {
        "positive": positive_count,
        "negative": negative_count
    }

def calculate_streak(db: Session, session_ids: List[int]) -> int:
    """Calcular racha de días consecutivos con análisis"""
    if not session_ids:
        return 0
    
    # Obtener fechas únicas de análisis, ordenadas descendentemente
    dates_query = db.query(
        func.date(Analysis.fecha_analisis).label('analysis_date')
    ).filter(
        Analysis.id_sesion.in_(session_ids)
    ).distinct().order_by(
        func.date(Analysis.fecha_analisis).desc()
    ).all()
    
    if not dates_query:
        return 0
    
    dates = [row.analysis_date for row in dates_query]
    today = datetime.now().date()
    
    streak = 0
    current_date = today
    
    for analysis_date in dates:
        if analysis_date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        elif analysis_date == current_date + timedelta(days=1):
            # Si hay un gap de un día, podemos continuar
            streak += 1
            current_date = analysis_date - timedelta(days=1)
        else:
            break
    
    return streak

@router.get("/history", response_model=AnalysisHistoryResponse)
def get_user_history(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
    emotion_filter: Optional[str] = None
):
    """
    Obtiene el historial de análisis del usuario usando datos reales
    """
    user = get_current_user(authorization, db)
    
    # Obtener sesiones del usuario
    user_sessions = db.query(UserSession).filter(UserSession.id_usuario == user.id).all()
    session_ids = [session.id for session in user_sessions]
    
    if not session_ids:
        return AnalysisHistoryResponse(analyses=[], total=0)
    
    # Query base
    query = db.query(Analysis, Emotion).join(
        Emotion, Analysis.id_emocion == Emotion.id
    ).filter(Analysis.id_sesion.in_(session_ids))
    
    # Filtrar por emoción si se especifica
    if emotion_filter and emotion_filter != 'all':
        query = query.filter(Emotion.nombre == emotion_filter)
    
    # Obtener resultados ordenados por fecha
    results = query.order_by(Analysis.fecha_analisis.desc()).all()
    
    # Convertir a formato de respuesta
    analyses = []
    for analysis, emotion in results:
        analyses.append(AnalysisHistory(
            id=str(analysis.id),
            emotion=emotion.nombre,
            confidence=analysis.confidence or 0.0,
            date=analysis.fecha_analisis,
            emotions_detected=analysis.emotions_detected or {}
        ))
    
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
    Guarda el resultado de un análisis de emoción en la base de datos real
    """
    user = get_current_user(authorization, db)
    ensure_emotions_exist(db)
    
    try:
        # Obtener la sesión activa más reciente del usuario
        latest_session = db.query(UserSession).filter(
            UserSession.id_usuario == user.id,
            UserSession.fecha_fin.is_(None)
        ).order_by(UserSession.fecha_inicio.desc()).first()
        
        if not latest_session:
            # Crear una nueva sesión si no hay ninguna activa
            latest_session = UserSession(
                id_usuario=user.id,
                fecha_inicio=datetime.utcnow()
            )
            db.add(latest_session)
            db.commit()
            db.refresh(latest_session)
        
        # Obtener o crear la emoción
        emotion_name = analysis_data.get("emotion")
        emotion = db.query(Emotion).filter(Emotion.nombre == emotion_name).first()
        
        if not emotion:
            emotion = Emotion(nombre=emotion_name)
            db.add(emotion)
            db.commit()
            db.refresh(emotion)
        
        # Verificar si ya existe un análisis muy reciente (últimos 30 segundos)
        now = datetime.utcnow()
        recent_analysis = db.query(Analysis).filter(
            and_(
                Analysis.id_sesion == latest_session.id,
                Analysis.id_emocion == emotion.id,
                Analysis.fecha_analisis >= now - timedelta(seconds=30)
            )
        ).first()
        
        if recent_analysis:
            print(f"⚠️ Análisis duplicado detectado para usuario {user.id}, ignorando...")
            return {"message": "Análisis ya fue guardado recientemente", "success": True}
        
        # Crear nuevo registro de análisis
        new_analysis = Analysis(
            id_sesion=latest_session.id,
            id_emocion=emotion.id,
            fecha_analisis=now,
            confidence=analysis_data.get("confidence", 0.0),
            emotions_detected=analysis_data.get("emotions_detected", {})
        )
        
        db.add(new_analysis)
        db.commit()
        
        print(f"✅ Análisis guardado en BD para usuario {user.id}: {emotion_name}")
        
        return {"message": "Análisis guardado exitosamente", "success": True}
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error guardando análisis: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al guardar el análisis"
        )