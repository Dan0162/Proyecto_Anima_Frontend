from fastapi import HTTPException, status
from server.core.security import hash_password, verify_password, create_access_token, verify_token
from server.schemas.user import UserCreate, UserResponse
from server.schemas.auth import UserLogin, TokenResponse
from server.db.session import SessionLocal
from sqlalchemy.orm import Session
from server.db.models.user import User

def register_user(db: Session, user: UserCreate) -> UserResponse:

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )


    hashed_pw = hash_password(user.password)
    db_user = User(
        nombre=user.name,
        email=user.email,
        password=hashed_pw
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return UserResponse.from_orm(db_user)



def login_user(db: Session, user: UserLogin) -> TokenResponse:
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña invalida"
        )
    access_token = create_access_token(data={"sub": db_user.email})
    return TokenResponse(access_token=access_token)  # ← ¡Este return es esencial!
    
    
  