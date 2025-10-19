from pydantic import BaseModel, EmailStr, field_validator

class RequestPasswordRecovery(BaseModel):
    email: EmailStr

class VerifyRecoveryCode(BaseModel):
    email: EmailStr
    code: str
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if not v.isdigit():
            raise ValueError('El código debe contener solo números')
        if len(v) != 6:
            raise ValueError('El código debe tener 6 dígitos')
        return v

class ResetPassword(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v):
        if not v.isdigit():
            raise ValueError('El código debe contener solo números')
        if len(v) != 6:
            raise ValueError('El código debe tener 6 dígitos')
        return v
    
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

class PasswordRecoveryResponse(BaseModel):
    message: str
    success: bool