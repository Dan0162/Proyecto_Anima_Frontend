from pydantic_settings import BaseSettings, SettingsConfigDict
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    DATABASE_URL: str

    # Seguridad
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60


    model_config = SettingsConfigDict(
        env_file = os.path.join(BASE_DIR, '.env'),
        env_file_encoding = "utf-8"
    )
    
settings = Settings()



