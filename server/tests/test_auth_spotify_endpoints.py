from fastapi.testclient import TestClient
from server.app.main import app
from server.core.security import create_access_token

client = TestClient(app)


def make_spotify_jwt():
    payload = {"spotify": {"access_token": "at", "refresh_token": "rt", "expires_in": 3600}}
    return create_access_token(payload)


def test_spotify_status_connected_and_disconnect():
    token = make_spotify_jwt()
    # Connected True
    res = client.get("/v1/auth/spotify/status", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json().get("connected") is True

    # Disconnect always returns disconnected True
    dis = client.post("/v1/auth/spotify/disconnect", headers={"Authorization": f"Bearer {token}"})
    assert dis.status_code == 200
    assert dis.json().get("disconnected") is True


def test_spotify_revoke_best_effort():
    token = make_spotify_jwt()
    res = client.post("/v1/auth/spotify/revoke", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json().get("revoked") is True
