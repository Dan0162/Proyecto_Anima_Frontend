import pytest
from server.controllers.user_controller import update_user_profile, change_user_password
from server.db.models.user import User
from server.core.security import hash_password, verify_password


def seed_user(db, email="update@example.com", nombre="Original", password="Password123!"):
    user = User(nombre=nombre, email=email, password=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_update_user_profile_name_and_email(db_session):
    user = seed_user(db_session)
    from server.schemas.user import UserUpdate
    updated = update_user_profile(db_session, user.email, UserUpdate(nombre="Changed", email="changed@example.com"))
    assert updated.nombre == "Changed"
    assert updated.email == "changed@example.com"


def test_update_user_profile_email_conflict(db_session):
    u1 = seed_user(db_session, email="conflict1@example.com")
    u2 = seed_user(db_session, email="conflict2@example.com")
    from server.schemas.user import UserUpdate
    with pytest.raises(Exception):
        update_user_profile(db_session, u1.email, UserUpdate(email=u2.email))


def test_change_password_success(db_session):
    user = seed_user(db_session, email="pwchange@example.com")
    from server.schemas.user import ChangePassword
    resp = change_user_password(db_session, user.email, ChangePassword(current_password="Password123!", new_password="NewPassword123!"))
    assert resp["success"] is True
    db_session.refresh(user)
    assert verify_password("NewPassword123!", user.password)


def test_change_password_wrong_current(db_session):
    user = seed_user(db_session, email="wrongcurrent@example.com")
    from server.schemas.user import ChangePassword
    with pytest.raises(Exception):
        change_user_password(db_session, user.email, ChangePassword(current_password="BadPass", new_password="AnotherPass123!"))
