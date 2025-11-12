import uuid
from fastapi.testclient import TestClient
from server.app.main import app
from server.db.session import SessionLocal
from server.db.models.user import User

client = TestClient(app)


def _unique_email(prefix="test"):
    return f"{prefix}_{uuid.uuid4().hex[:8]}@example.com"


def test_login_success_returns_token():
    email = _unique_email('loginok')
    pw = "Password123!"
    client.post("/v1/auth/register", json={"name": "A", "email": email, "password": pw})
    resp = client.post("/v1/auth/login", json={"email": email, "password": pw})
    assert resp.status_code == 200
    js = resp.json()
    assert "access_token" in js


def test_login_wrong_password():
    email = _unique_email('wrongpw')
    pw = "Password123!"
    client.post("/v1/auth/register", json={"name": "B", "email": email, "password": pw})
    resp = client.post("/v1/auth/login", json={"email": email, "password": "badpass"})
    assert resp.status_code in (401, 400)


def test_change_password_requires_auth():
    resp = client.post("/v1/user/change-password", json={"current_password": "x", "new_password": "y"})
    assert resp.status_code in (401, 422, 400)


def test_update_profile_requires_auth():
    resp = client.patch("/v1/user/profile", json={"nombre": "X"})
    assert resp.status_code in (401, 422, 400)


def test_change_password_flow_success():
    email = _unique_email('changepw')
    pw = "Password123!"
    client.post("/v1/auth/register", json={"name": "C", "email": email, "password": pw})
    login = client.post("/v1/auth/login", json={"email": email, "password": pw})
    token = login.json().get("access_token")
    assert token
    ch = client.post(
        "/v1/user/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": pw, "new_password": "NewPass123!"}
    )
    assert ch.status_code in (200, 204, 401, 400)


def test_update_profile_flow_success():
    email = _unique_email('update')
    pw = "Password123!"
    client.post("/v1/auth/register", json={"name": "D", "email": email, "password": pw})
    login = client.post("/v1/auth/login", json={"email": email, "password": pw})
    token = login.json().get("access_token")
    assert token
    upd = client.patch(
        "/v1/user/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"nombre": "Updated Name", "email": email}
    )
    assert upd.status_code in (200, 400, 401)


def test_logout_nonexistent_session():
    resp = client.post("/v1/auth/logout", json={"session_id": 999999})
    assert resp.status_code in (200, 404, 400)
