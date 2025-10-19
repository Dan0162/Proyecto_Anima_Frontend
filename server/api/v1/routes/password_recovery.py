from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from server.db.session import get_db
from server.schemas.password_recovery import (
    RequestPasswordRecovery,
    VerifyRecoveryCode,
    ResetPassword,
    PasswordRecoveryResponse
)
from server.controllers.password_recovery_controller import (
    request_password_recovery,
    verify_recovery_code,
    reset_password
)

router = APIRouter(prefix="/v1/password-recovery", tags=["password-recovery"])

@router.post("/request", response_model=PasswordRecoveryResponse, status_code=status.HTTP_200_OK)
def request_recovery(data: RequestPasswordRecovery, db: Session = Depends(get_db)):
    """
    Solicita recuperación de contraseña.
    Envía un código de verificación al email si existe.
    """
    return request_password_recovery(db, data)

@router.post("/verify", response_model=PasswordRecoveryResponse, status_code=status.HTTP_200_OK)
def verify_code(data: VerifyRecoveryCode, db: Session = Depends(get_db)):
    """
    Verifica que el código de recuperación sea válido.
    """
    return verify_recovery_code(db, data)

@router.post("/reset", response_model=PasswordRecoveryResponse, status_code=status.HTTP_200_OK)
def reset_user_password(data: ResetPassword, db: Session = Depends(get_db)):
    """
    Restablece la contraseña del usuario usando el código de verificación.
    """
    return reset_password(db, data)