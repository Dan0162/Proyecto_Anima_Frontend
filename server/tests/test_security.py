from datetime import timedelta
import pytest
from jose import JWTError

from server.core.security import hash_password, verify_password, create_access_token, verify_token


def test_hash_and_verify_password_basic():
    pw = "MySecret123!"
    hashed = hash_password(pw)
    assert isinstance(hashed, str)
    assert hashed != pw
    assert verify_password(pw, hashed)
    assert not verify_password("wrong", hashed)


def test_hash_password_truncates_over_72_bytes():
    # 80 'a' bytes will be truncated to 72 on hashing; verification should use same 72 prefix
    long_pw = "a" * 80
    hashed = hash_password(long_pw)
    assert verify_password(long_pw[:72], hashed)


def test_create_and_verify_jwt_with_exp():
    token = create_access_token({"sub": "user@example.com"}, expires_delta=timedelta(seconds=1))
    payload = verify_token(token)
    assert payload.get("sub") == "user@example.com"


def test_verify_token_invalid():
    with pytest.raises(ValueError):
        verify_token("not-a-token")
