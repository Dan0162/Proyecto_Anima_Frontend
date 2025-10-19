from pydantic_settings import BaseSettings, SettingsConfigDict
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    DATABASE_URL: str

    # Seguridad
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Email credentials
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str


    model_config = SettingsConfigDict(
        env_file = os.path.join(BASE_DIR, '.env'),
        env_file_encoding = "utf-8",
    )

    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str
    # Callback path should match the route defined in the auth router
    SPOTIFY_REDIRECT_URI: str = "http://127.0.0.1:8000/v1/auth/spotify/callback"
    
settings = Settings()



