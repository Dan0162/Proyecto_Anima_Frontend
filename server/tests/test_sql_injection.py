import uuid
import pytest
from fastapi.testclient import TestClient

from server.app.main import app

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def test_register_with_sql_like_email_does_not_drop_table():
    """
    Asegura que intentar registrarse con un correo electrónico que contenga una carga con apariencia de SQL
    no cause que la tabla de usuarios sea eliminada ni que se dañe la base de datos.
    La prueba registra primero un usuario normal, luego envía un correo con aspecto malicioso
    y finalmente consulta la base de datos para confirmar que el usuario original todavía existe
    y que la tabla sigue intacta.
    """
    safe_email = _unique_email("safe")
    resp = client.post("/v1/auth/register", json={"name": "SafeUser", "email": safe_email, "password": "Password123!"})
    # El registro puede devolver 200 o 400 si el usuario ya existe; se acepta cualquier código que no sea 5xx
    assert resp.status_code < 500

    malicious_email = "injection'); DROP TABLE usuario; --@example.com"
    mal_resp = client.post("/v1/auth/register", json={"name": "Evil", "email": malicious_email, "password": "Password123!"})

    # El servidor no debe fallar ni devolver un error 500 ante una entrada maliciosa
    assert mal_resp.status_code < 500

    # Verificar que la base de datos aún tenga el usuario seguro y que la tabla sea consultable
    from server.db.session import SessionLocal
    from server.db.models.user import User
    db = SessionLocal()
    try:
        # Consultar no debería generar un OperationalError; asegurar que el usuario existe
        user = db.query(User).filter(User.email == safe_email).first()
        assert user is not None, "El usuario seguro desapareció después del intento de registro malicioso"

        # Asegurarse de que haya al menos un usuario en la tabla
        count = db.query(User).count()
        assert count >= 1
    finally:
        db.close()


def test_login_with_sql_payload_does_not_authenticate():
    """
    Asegura que un intento de inicio de sesión usando una carga con estilo clásico de inyección SQL
    en el campo de correo electrónico no logre evadir la autenticación.
    """
    email = _unique_email("login")
    pw = "Password123!"
    # Registrar el usuario
    reg = client.post("/v1/auth/register", json={"name": "LoginUser", "email": email, "password": pw})
    assert reg.status_code < 500

    # Intentar iniciar sesión con una carga similar a SQL que intente forzar una condición verdadera
    payload_email = email + "' OR '1'='1"
    login = client.post("/v1/auth/login", json={"email": payload_email, "password": "wrongpw"})

    # No debería devolver 200 (no debe permitir el acceso). Se espera 401, 400 u otro código similar, pero no 200
    assert login.status_code != 200, "El inicio de sesión tuvo éxito con una carga SQL, posible vulnerabilidad de inyección"
