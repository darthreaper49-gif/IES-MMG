import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select, text

from ..models import Camera, Event, Incident, Review
from ..schemas import SummaryOut, SystemHealthOut
from ..security import DB, CurrentUser, get_user, grant_ids

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health", response_model=SystemHealthOut)
def health(request: Request) -> dict[str, object]:
    database = "available"
    try:
        with request.app.state.sessions() as db:
            db.execute(text("SELECT 1"))
    except Exception:
        database = "unavailable"
    return {
        "status": "ok" if database == "available" else "degraded",
        "environment": "simulation",
        "api": "available",
        "database": database,
        "camera_adapter": "synthetic",
        "video_gateway": "not_connected",
        "ai_model": "not_connected",
        "recording": "disabled",
    }


@router.get("/summary", response_model=SummaryOut)
def summary(db: DB, user: CurrentUser) -> dict[str, object]:
    # Administrators manage all metadata, but dashboard media/event counts remain
    # scoped to explicit grants, just like the camera and event lists they link to.
    ids = grant_ids(db, user)
    cameras = select(Camera).where(Camera.id.in_(ids))
    pending = (
        select(func.count())
        .select_from(Event)
        .where(Event.review_status == "pending", Event.camera_id.in_(ids))
    )
    incidents = select(func.count()).select_from(Incident).where(Incident.camera_id.in_(ids))
    rows = list(db.scalars(cameras))
    return {
        "cameras_total": len(rows),
        "cameras_online": sum(c.status == "online" and c.enabled for c in rows),
        "cameras_degraded": sum(c.status == "degraded" and c.enabled for c in rows),
        "cameras_offline": sum(c.status in {"offline", "unknown"} or not c.enabled for c in rows),
        "pending_reviews": db.scalar(pending) or 0,
        "confirmed_incidents": db.scalar(incidents) or 0,
        "environment": "simulation",
    }


@router.get("/event-updates")
async def event_updates(request: Request, user: CurrentUser) -> StreamingResponse:
    # Short-lived streams reconnect through EventSource. Cookies are never placed in URLs.
    async def stream() -> AsyncIterator[str]:
        last = None
        user_id = user.id
        for tick in range(150):
            if await request.is_disconnected():
                break
            with request.app.state.sessions() as db:
                try:
                    get_user(request, db)
                except HTTPException:
                    break
                query = select(Event.camera_id, Event.version, Event.observed_at)
                reviews = select(func.count()).select_from(Review)
                ids = grant_ids(db, user_id)
                query = query.where(Event.camera_id.in_(ids))
                reviews = reviews.where(Review.event_id.in_(select(Event.id).where(Event.camera_id.in_(ids))))
                rows = db.execute(query.order_by(Event.observed_at.desc(), Event.id.desc()).limit(100)).all()
                camera_rows = db.execute(
                    select(Camera.id, Camera.version, Camera.enabled, Camera.status)
                    .where(Camera.id.in_(ids))
                    .order_by(Camera.id)
                ).all()
                revision = str(
                    (
                        [(r.camera_id, r.version, str(r.observed_at)) for r in rows],
                        db.scalar(reviews),
                        [tuple(row) for row in camera_rows],
                    )
                )
            if revision != last:
                last = revision
                yield f"event: update\ndata: {json.dumps({'source': 'simulation'})}\n\n"
            elif tick % 10 == 0:
                yield ": heartbeat\n\n"
            await asyncio.sleep(2)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
