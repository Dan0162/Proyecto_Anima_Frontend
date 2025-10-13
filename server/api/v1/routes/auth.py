from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.controllers.auth_controller import register_user, login_user
from server.core.security import get_current_user
from server.db.models.user import User

router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    return register_user(db, user)

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, user)

@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Obtener información del usuario autenticado actual
    """
    return UserResponse(
        id=current_user.id,
        nombre=current_user.nombre,
        email=current_user.email,
        message="Usuario autenticado correctamente"
    )
