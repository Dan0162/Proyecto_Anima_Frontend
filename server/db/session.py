from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from server.core.config import settings

# Ensure we use psycopg v3 driver
db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://") and "+" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    db_url,
    pool_pre_ping=True,
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()