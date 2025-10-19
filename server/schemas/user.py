from pydantic import BaseModel, EmailStr, field_validator

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('La contraseña no puede exceder 72 caracteres')
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        return v


class UserResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    message: str | None = None
    
    class Config:
        from_attributes = True


# Schema para actualizar perfil
class UserUpdate(BaseModel):
    nombre: str | None = None
    email: EmailStr | None = None
    
    class Config:
        from_attributes = True


# Schema para cambiar contraseña
class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('La contraseña no puede exceder 72 caracteres')
        if len(v) < 8:
            raise ValueError('La contraseña debe tener al menos 8 caracteres')
        if not any(c.isupper() for c in v):
            raise ValueError('La contraseña debe contener al menos una mayúscula')
        if not any(c.islower() for c in v):
            raise ValueError('La contraseña debe contener al menos una minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v