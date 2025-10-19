from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from server.db.models.user import User
from server.schemas.user import UserResponse, UserUpdate, ChangePassword
from server.core.security import verify_password, hash_password


def get_user_by_id(db: Session, user_id: int) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserResponse.from_orm(user)


# Actualizar perfil de usuario
def update_user_profile(db: Session, user_email: str, user_data: UserUpdate) -> UserResponse:
    """
    Actualiza el perfil del usuario (nombre y/o email)
    """
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar nombre si se proporciona
    if user_data.nombre:
        user.nombre = user_data.nombre
    
    # Actualizar email si se proporciona y es diferente
    if user_data.email and user_data.email != user.email:
        # Verificar que el nuevo email no esté en uso
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este email ya está en uso"
            )
        user.email = user_data.email
    
    try:
        db.commit()
        db.refresh(user)
        return UserResponse.from_orm(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar el perfil"
        )


# Cambiar contraseña
def change_user_password(db: Session, user_email: str, password_data: ChangePassword) -> dict:
    """
    Cambia la contraseña del usuario
    """
    user = db.query(User).filter(User.email == user_email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Verificar contraseña actual
    if not verify_password(password_data.current_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta"
        )
    
    # Actualizar contraseña
    user.password = hash_password(password_data.new_password)
    
    try:
        db.commit()
        return {"message": "Contraseña actualizada exitosamente", "success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar la contraseña"
        )