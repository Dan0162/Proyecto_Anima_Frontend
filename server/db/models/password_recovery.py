from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from server.db.base import Base

class PasswordRecovery(Base):
    __tablename__ = "recuperacion_contrasena"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column('id_usuario', Integer, ForeignKey('usuario.id', ondelete='CASCADE'), nullable=False)
    code = Column('codigo', String(6), nullable=False)
    created_at = Column('hora_creacion', DateTime, default=datetime.utcnow)
    expires_at = Column('hora_expiracion', DateTime, nullable=False)
    is_used = Column('usado', Boolean, default=False)

    user = relationship("User", backref="recovery_codes")