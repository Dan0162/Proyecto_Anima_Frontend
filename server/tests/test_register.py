
import pytest
from fastapi.testclient import TestClient
from server.app.main import app
import uuid

client = TestClient(app)

@pytest.fixture
def user_data():
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    return {
        "name": "testuser",
        "email": unique_email,
        "password": "TestPassword123!"
    }

def test_register_success(user_data):
    response = client.post("/v1/auth/register", json=user_data)
    assert response.status_code == 201 or response.status_code == 200
    data = response.json()
    assert "id" in data or "user" in data
    assert data.get("email") == user_data["email"] or data.get("user", {}).get("email") == user_data["email"]

def test_register_duplicate_email(user_data):
    # Register once
    client.post("/v1/auth/register", json=user_data)
    # Try to register again with same email
    response = client.post("/v1/auth/register", json=user_data)
    assert response.status_code == 400 or response.status_code == 409
    data = response.json()
    assert "email" in data.get("detail", "") or "already" in data.get("detail", "")

def test_register_invalid_email():
    bad_data = {
        "name": "baduser",
        "email": "not-an-email",
        "password": "TestPassword123!"
    }
    response = client.post("/v1/auth/register", json=bad_data)
    assert response.status_code == 422 or response.status_code == 400

def test_register_weak_password():
    bad_data = {
        "name": "weakpass",
        "email": "weakpass@example.com",
        "password": "123"
    }
    response = client.post("/v1/auth/register", json=bad_data)
    assert response.status_code == 422 or response.status_code == 400
