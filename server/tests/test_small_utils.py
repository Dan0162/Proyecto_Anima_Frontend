from server.services.email import generate_verification_code
from server.services.spotify import get_spotify_auth_url, CLIENT_ID


def test_generate_verification_code_length():
    code = generate_verification_code()
    assert isinstance(code, str)
    assert len(code) == 6
    assert code.isdigit()


def test_get_spotify_auth_url_contains_client_and_state():
    state = "mystate123"
    url = get_spotify_auth_url(state)
    assert state in url
    assert str(CLIENT_ID) in url