from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, String, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from server.db.base import Base

class Emotion(Base):
    __tablename__ = "emocion"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    fecha_creacion = Column(TIMESTAMP, default=datetime.utcnow)
    
    analyses = relationship("Analysis", back_populates="emotion")

class Analysis(Base):
    __tablename__ = "analisis"
    
    id = Column(Integer, primary_key=True, index=True)
    id_sesion = Column(Integer, ForeignKey("sesion.id", ondelete="CASCADE"), nullable=False)
    id_emocion = Column(Integer, ForeignKey("emocion.id", ondelete="CASCADE"), nullable=False)
    fecha_analisis = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Campos adicionales para guardar más información del análisis
    confidence = Column(Float, default=0.0)
    emotions_detected = Column(JSON)  # Para guardar el dict completo de emociones
    recommendations = Column(JSON)    # Para guardar las recomendaciones musicales
    
    session = relationship("Session", foreign_keys=[id_sesion])
    emotion = relationship("Emotion", back_populates="analyses")