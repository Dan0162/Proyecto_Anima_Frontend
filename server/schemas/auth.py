from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    session_id: int | None = None