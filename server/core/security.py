from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import bcrypt
from server.core.config import settings


def hash_password(password: str) -> str:
    """
    Hashea la contraseña usando bcrypt
    """
    # Validación adicional por si acaso
    if len(password.encode('utf-8')) > 72:
        password = password[:72]
    
    # Convertir a bytes y hashear
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Retornar como string para almacenar en la BD
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica la contraseña contra el hash
    """
    try:
        # Convertir a bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Verificar
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# Generación de token JWT (sin cambios)
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise ValueError("Token inválido o expirado")