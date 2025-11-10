from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from server.db.base import Base

class Session(Base):
    __tablename__ = "sesion"
    id = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id", ondelete="CASCADE"), nullable=False)
    fecha_inicio = Column(TIMESTAMP)
    fecha_fin = Column(TIMESTAMP, nullable=True)

    user = relationship("User", back_populates="sessions")
