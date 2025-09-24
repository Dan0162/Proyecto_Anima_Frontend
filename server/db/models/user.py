from sqlalchemy import Column, Integer, String
from server.db.base import Base

class User(Base):
    __tablename__ = "usuario"  
    #__table_args__ = {'quote': False}  # evita las comillas

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)