import os
import pathlib
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.db.base import Base
# Import models so tables are registered
from server.db.models import user as user_model  # noqa: F401
from server.db.models import session as session_model  # noqa: F401


TEST_DB_PATH = pathlib.Path(__file__).parent / "test.db"


@pytest.fixture(scope="session")
def engine():
    """Create a SQLite test database engine."""
    url = f"sqlite:///{TEST_DB_PATH}"
    eng = create_engine(url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    yield eng
    eng.dispose()
    if TEST_DB_PATH.exists():
        try:
            TEST_DB_PATH.unlink()
        except Exception:
            pass


@pytest.fixture()
def db_session(engine):
    """Yield a SQLAlchemy session bound to the test engine."""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
