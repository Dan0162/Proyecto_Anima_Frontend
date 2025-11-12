import os
import pathlib
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from server.db.base import Base
# Import models so tables are registered
from server.db.models import user as user_model  # noqa: F401
from server.db.models import session as session_model  # noqa: F401

# Tests should not attempt to send real emails. Monkeypatch the email sender
# to a no-op that returns True so password-recovery flows work offline.
try:
    from server.services import email as _email_service
    # Keep an in-memory record of sent codes for tests to inspect
    _email_service._sent_codes = {}
    def _test_send_verification_email(recipient, code):
        try:
            _email_service._sent_codes[recipient] = code
        except Exception:
            pass
        return True
    _email_service.send_verification_email = _test_send_verification_email
except Exception:
    pass


TEST_DB_PATH = pathlib.Path(__file__).parent / "test.db"


@pytest.fixture(scope="session")
def engine():
    """Create a SQLite test database engine."""
    url = f"sqlite:///{TEST_DB_PATH}"
    eng = create_engine(url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    # Ensure the application uses this test engine/sessionmaker so TestClient
    # and route handlers use the same SQLite test DB instead of the one
    # configured in server.core.config (DATABASE_URL).
    try:
        import server.db.session as app_db_session
        # Replace the engine and SessionLocal used by the app with test ones
        app_db_session.engine = eng
        app_db_session.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    except Exception:
        # If patching fails, tests may still pass when run with explicit DATABASE_URL
        pass
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


@pytest.fixture(autouse=True)
def transactional_test(engine):
    """
    Start a transaction for each test and patch the application's SessionLocal
    so that all sessions created by the app use the same connection. Rollback
    at the end of the test to guarantee isolation.
    """
    # Connect and begin an outer transaction
    connection = engine.connect()
    trans = connection.begin()

    # Create a sessionmaker bound to this connection and patch the app
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    try:
        import server.db.session as app_db_session
        prev_SessionLocal = getattr(app_db_session, 'SessionLocal', None)
        app_db_session.SessionLocal = TestingSessionLocal
    except Exception:
        prev_SessionLocal = None

    try:
        yield
    finally:
        # restore original SessionLocal
        if prev_SessionLocal is not None:
            try:
                app_db_session.SessionLocal = prev_SessionLocal
            except Exception:
                pass
        # rollback outer transaction and close connection
        try:
            trans.rollback()
        except Exception:
            pass
        try:
            connection.close()
        except Exception:
            pass
