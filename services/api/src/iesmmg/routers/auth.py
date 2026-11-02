import secrets

from fastapi import APIRouter, HTTPException, Request, Response
from sqlalchemy import select

from ..models import User
from ..schemas import Login, SessionOut, UserOut
from ..security import (
    COOKIE,
    CSRF_COOKIE,
    DB,
    CurrentUser,
    _login_attempts,
    audit,
    csrf,
    current_session,
    new_session,
    record_login_failure,
    throttle_login,
    token_hash,
    user_out,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def session_cookie(response: Response, request: Request, token: str, csrf_token: str) -> None:
    secure = request.app.state.settings.secure_cookies
    response.set_cookie(
        COOKIE,
        token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=request.app.state.settings.session_hours * 3600,
        path="/",
    )
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=request.app.state.settings.session_hours * 3600,
        path="/",
    )


@router.get("/csrf")
def get_csrf(response: Response, request: Request) -> dict[str, str]:
    token = secrets.token_urlsafe(32)
    response.set_cookie(
        CSRF_COOKIE,
        token,
        httponly=True,
        secure=request.app.state.settings.secure_cookies,
        samesite="lax",
        path="/",
    )
    return {"csrf_token": token}


@router.post("/session", response_model=SessionOut)
def login(body: Login, request: Request, response: Response, db: DB) -> dict[str, object]:
    csrf(request, db)
    username = body.username.lower().strip()
    key = f"{request.client.host if request.client else 'unknown'}:{username}"
    throttle_login(key)
    user = db.scalar(select(User).where(User.username == username))
    if user is None or not user.active or not verify_password(user.password_hash, body.password):
        record_login_failure(key)
        raise HTTPException(401, "Incorrect username or password.")
    _login_attempts.pop(key, None)
    old = request.cookies.get(COOKIE)
    if old:
        # Invalid/expired cookies are replaced; valid sessions are rotated.
        from ..models import Session as AuthSession

        previous = db.get(AuthSession, token_hash(old))
        if previous:
            db.delete(previous)
    token, session = new_session(db, user, request.app.state.settings.session_hours)
    audit(db, user, "session.login", "user", user.id, "Demo session established.")
    db.commit()
    session_cookie(response, request, token, session.csrf_token)
    return {
        "user": user_out(db, user),
        "csrf_token": session.csrf_token,
        "environment": "simulation",
    }


@router.get("/session", response_model=SessionOut)
def get_session(request: Request, db: DB, user: CurrentUser) -> dict[str, object]:
    return {
        "user": user_out(db, user),
        "csrf_token": current_session(request, db).csrf_token,
        "environment": "simulation",
    }


@router.delete("/session", status_code=204)
def logout(request: Request, response: Response, db: DB, user: CurrentUser) -> None:
    csrf(request, db, user)
    session = current_session(request, db)
    audit(db, user, "session.logout", "user", user.id, "Session revoked.")
    db.delete(session)
    db.commit()
    response.delete_cookie(COOKIE, path="/")
    response.delete_cookie(CSRF_COOKIE, path="/")


@router.get("/me", response_model=UserOut)
def me(db: DB, user: CurrentUser) -> dict[str, object]:
    return user_out(db, user)
