import hashlib
import hmac
import secrets
import time
from collections.abc import Iterator
from datetime import UTC, timedelta
from typing import Annotated
from urllib.parse import urlsplit

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Camera, CameraGrant, User, now
from .models import Session as UserSession

hasher = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)
COOKIE = "iesmmg_session"
CSRF_COOKIE = "iesmmg_csrf"
PERMISSIONS = {
    "viewer": {"camera:read", "event:read", "stream:view"},
    "security_operator": {
        "camera:read",
        "event:read",
        "stream:view",
        "event:review",
        "incident:confirm",
    },
    "administrator": {"camera:read", "camera:manage", "event:read", "audit:read", "user:read"},
}
_login_attempts: dict[str, list[float]] = {}


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def verify_password(encoded: str, password: str) -> bool:
    try:
        return hasher.verify(encoded, password)
    except (VerificationError, InvalidHashError):
        return False


def throttle_login(key: str) -> None:
    current = time.monotonic()
    for old in list(_login_attempts):
        if not _login_attempts[old] or current - _login_attempts[old][-1] > 300:
            del _login_attempts[old]
    attempts = [t for t in _login_attempts.get(key, []) if current - t < 300]
    if len(attempts) >= 8:
        raise HTTPException(429, "Too many sign-in attempts. Try again in five minutes.")
    if len(_login_attempts) > 2000:
        raise HTTPException(429, "Sign-in service is busy. Try again later.")
    _login_attempts[key] = attempts


def record_login_failure(key: str) -> None:
    _login_attempts.setdefault(key, []).append(time.monotonic())


def check_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    if not origin:
        return
    settings = request.app.state.settings
    allowed_host = request.headers.get("host", "").lower()
    try:
        parsed = urlsplit(origin)
        host = urlsplit(f"//{allowed_host}")
        valid_host = (
            host.hostname == parsed.hostname
            and host.port == parsed.port
            and not host.username
            and not parsed.path
            and not parsed.query
            and not parsed.fragment
        )
    except ValueError as exc:
        raise HTTPException(403, "Request origin is not allowed.") from exc
    if parsed.scheme not in {"http", "https"} or not valid_host:
        if origin != settings.extra_origin:
            raise HTTPException(403, "Request origin is not allowed.")


def current_session(request: Request, db: Session) -> UserSession:
    token = request.cookies.get(COOKIE, "")
    session = db.get(UserSession, token_hash(token)) if token else None
    if session is not None:
        expires = session.expires_at
        expires = expires.replace(tzinfo=UTC) if expires.tzinfo is None else expires.astimezone(UTC)
        if expires > now():
            return session
    raise HTTPException(401, "Your session has expired. Please sign in.")


def get_db(request: Request) -> Iterator[Session]:
    with request.app.state.sessions() as db:
        yield db


DB = Annotated[Session, Depends(get_db)]


def get_user(request: Request, db: DB) -> User:
    session = current_session(request, db)
    user = db.get(User, session.user_id)
    if user is None or not user.active:
        raise HTTPException(401, "Account is unavailable.")
    return user


CurrentUser = Annotated[User, Depends(get_user)]


def require(permission: str) -> object:
    def dependency(user: CurrentUser) -> User:
        if permission not in PERMISSIONS[user.role]:
            raise HTTPException(403, "You do not have permission for this action.")
        return user

    return dependency


def csrf(request: Request, db: Session, user: User | None = None) -> None:
    check_origin(request)
    supplied = request.headers.get("x-csrf-token", "")
    if user is not None:
        session = current_session(request, db)
        expected = session.csrf_token
    else:
        expected = request.cookies.get(CSRF_COOKIE, "")
    if not expected or not supplied or not hmac.compare_digest(expected, supplied):
        raise HTTPException(403, "Invalid CSRF token. Refresh and try again.")


def grant_ids(db: Session, user: User | str) -> list[str]:
    user_id = user if isinstance(user, str) else user.id
    return list(db.scalars(select(CameraGrant.camera_id).where(CameraGrant.user_id == user_id)))


def accessible_camera(db: Session, user: User, camera_id: str, permission: str) -> Camera:
    camera = db.get(Camera, camera_id)
    if camera is None:
        raise HTTPException(404, "Camera not found.")
    if permission != "camera:manage" and camera_id not in grant_ids(db, user):
        raise HTTPException(404, "Camera not found.")
    if permission not in PERMISSIONS[user.role]:
        raise HTTPException(403, "You do not have permission for this action.")
    return camera


def user_out(db: Session, user: User) -> dict[str, object]:
    ids = grant_ids(db, user)
    return {
        "id": user.id,
        "username": user.username,
        "display_name": user.display_name,
        "role": user.role,
        "active": user.active,
        "permissions": sorted(PERMISSIONS[user.role]),
        "camera_ids": None if user.role == "administrator" else ids,
    }


def new_session(db: Session, user: User, hours: int) -> tuple[str, UserSession]:
    token = secrets.token_urlsafe(32)
    session = UserSession(
        token_hash=token_hash(token),
        user_id=user.id,
        csrf_token=secrets.token_urlsafe(32),
        expires_at=now() + timedelta(hours=hours),
    )
    db.add(session)
    return token, session


def audit(
    db: Session, actor: User | None, action: str, resource_type: str, resource_id: str, detail: str
) -> None:
    from .models import AuditEvent

    db.add(
        AuditEvent(
            actor_id=actor.id if actor else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail[:250],
        )
    )
