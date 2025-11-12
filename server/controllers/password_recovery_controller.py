from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from server.db.models.user import User
from server.db.models.password_recovery import PasswordRecovery
from server.services.email import send_verification_email, generate_verification_code
from server.core.security import hash_password, verify_password
from server.schemas.password_recovery import (
    RequestPasswordRecovery,
    VerifyRecoveryCode,
    ResetPassword,
    PasswordRecoveryResponse
)

def request_password_recovery(db: Session, data: RequestPasswordRecovery) -> PasswordRecoveryResponse:
    """
    Solicita recuperación de contraseña y envía código por email
    """
    # Verificar si el usuario existe
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        # Por seguridad, no revelamos si el email existe o no
        return PasswordRecoveryResponse(
            message="Si el correo existe, recibirás un código de verificación",
            success=True
        )
    
    # Invalidar códigos anteriores no usados de este usuario
        db.query(PasswordRecovery).filter(
            PasswordRecovery.user_id == user.id,
            PasswordRecovery.is_used == False
    ).update({"is_used": True})
    
    # Generar nuevo código
    code = generate_verification_code()
    
    # Crear registro de recuperación (expira en 15 minutos)
    recovery = PasswordRecovery(
        user_id=user.id,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        is_used=False
    )
    
    db.add(recovery)
    db.commit()
    
    # Enviar email con el código
    email_sent = send_verification_email(user.email, code)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el correo de verificación"
        )
    
    return PasswordRecoveryResponse(
        message="Código de verificación enviado a tu correo",
        success=True
    )


def verify_recovery_code(db: Session, data: VerifyRecoveryCode) -> PasswordRecoveryResponse:
    """
    Verifica que el código de recuperación sea válido
    """
    # Buscar usuario
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Buscar código válido
    recovery = db.query(PasswordRecovery).filter(
        PasswordRecovery.user_id == user.id,
        PasswordRecovery.code == data.code,
        PasswordRecovery.is_used == False,
    PasswordRecovery.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not recovery:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )
    
    return PasswordRecoveryResponse(
        message="Código verificado correctamente",
        success=True
    )


def reset_password(db: Session, data: ResetPassword) -> PasswordRecoveryResponse:
    """
    Restablece la contraseña del usuario usando el código de verificación
    """
    # Buscar usuario
    user = db.query(User).filter(User.email == data.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Buscar código válido
    recovery = db.query(PasswordRecovery).filter(
        PasswordRecovery.user_id == user.id,
        PasswordRecovery.code == data.code,
        PasswordRecovery.is_used == False,
    PasswordRecovery.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not recovery:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido o expirado"
        )
    
    # Verificar que la nueva contraseña no sea igual a la anterior
    if verify_password(data.new_password, user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser igual a la anterior"
        )

    # Actualizar contraseña
    user.password = hash_password(data.new_password)

    # Marcar código como usado
    recovery.is_used = True

    db.commit()

    return PasswordRecoveryResponse(
        message="Contraseña actualizada exitosamente",
        success=True
    )