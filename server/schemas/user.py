from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    message: str | None = None   # Campo opcional para mensajes adicionales


    class Config:
        from_attributes = True