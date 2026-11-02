from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from ..models import AuditEvent, User
from ..schemas import AuditOut, Items, UserOut
from ..security import DB, CurrentUser, require, user_out

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/users", response_model=Items[UserOut])
def users(db: DB, user: Annotated[CurrentUser, Depends(require("user:read"))]) -> dict[str, object]:
    return {"items": [user_out(db, account) for account in db.scalars(select(User).order_by(User.username))]}


@router.get("/audit-events", response_model=Items[AuditOut])
def audit_events(db: DB, user: Annotated[CurrentUser, Depends(require("audit:read"))]) -> dict[str, object]:
    return {"items": list(db.scalars(select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(100)))}
