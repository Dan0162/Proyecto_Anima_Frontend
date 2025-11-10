from fastapi import HTTPException, status
from server.core.security import hash_password, verify_password, create_access_token, verify_token
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.db.session import SessionLocal
from sqlalchemy.orm import Session
from server.db.models.user import User
from server.db.models.session import Session as UserSession
from datetime import datetime
import re


def register_user(db: Session, user: UserCreate) -> UserResponse:
    
    # Simple email regex validation
    email_regex = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(email_regex, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico no es válido"
        )

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )


    try:
        hashed_pw = hash_password(user.password)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    db_user = User(
        nombre=user.name,
        email=user.email,
        password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.model_validate(db_user)



def login_user(db: Session, user: UserLogin) -> TokenResponse:
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña invalida"
        )
    # Create a new session record
    new_session = UserSession(id_usuario=db_user.id, fecha_inicio=datetime.utcnow())
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    session_id = new_session.id
    access_token = create_access_token(data={"sub": db_user.email, "session_id": session_id})
    return TokenResponse(access_token=access_token, session_id=session_id, user_name=db_user.nombre)


def logout_user(db: Session, session_id: int) -> bool:
    session_record = db.query(UserSession).filter(UserSession.id == session_id).first()
    print(f"[LOGOUT] Called for session_id={session_id}, found={bool(session_record)}")
    if not session_record:
        print("[LOGOUT] Session not found!")
        raise HTTPException(status_code=404, detail="Session not found")
    if session_record.fecha_fin is not None:
        print(f"[LOGOUT] Session {session_id} already finished at {session_record.fecha_fin}")
        return False
    session_record.fecha_fin = datetime.utcnow()
    db.commit()
    print(f"[LOGOUT] Session {session_id} updated with fecha_fin={session_record.fecha_fin}")
    return True


