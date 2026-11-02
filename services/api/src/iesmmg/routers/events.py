import base64
import json
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import Select, select, tuple_, update
from sqlalchemy.exc import IntegrityError

from ..models import Event, Incident, Review
from ..schemas import (
    EventOut,
    EventPage,
    IncidentCreate,
    IncidentOut,
    Items,
    ReviewCreate,
    Severity,
)
from ..security import DB, CurrentUser, audit, csrf, grant_ids, require

router = APIRouter(tags=["Events and incidents"])


def authorized_events(db: DB, user: CurrentUser) -> Select[Event]:
    query = select(Event).where(Event.camera_id.in_(grant_ids(db, user)))
    return query


def get_event(db: DB, user: CurrentUser, event_id: str) -> Event:
    event = db.scalar(authorized_events(db, user).where(Event.id == event_id))
    if event is None:
        raise HTTPException(404, "Event not found.")
    return event


def encode_cursor(event: Event) -> str:
    value = json.dumps([event.observed_at.isoformat(), event.id]).encode()
    return base64.urlsafe_b64encode(value).decode()


@router.get("/events", response_model=EventPage)
def list_events(
    db: DB,
    user: CurrentUser,
    limit: int = Query(50, ge=1, le=100),
    cursor: str | None = Query(default=None, max_length=512),
    camera_id: str | None = None,
    severity: Severity | None = None,
    review_status: str | None = None,
    category: str | None = None,
) -> dict[str, object]:
    query = authorized_events(db, user)
    if camera_id:
        query = query.where(Event.camera_id == camera_id)
    if severity:
        query = query.where(Event.severity == severity)
    if review_status:
        if review_status not in {"pending", "false_positive", "needs_investigation", "confirmed"}:
            raise HTTPException(422, "Unknown review status.")
        query = query.where(Event.review_status == review_status)
    if category:
        query = query.where(Event.category == category)
    if cursor:
        try:
            normalized = cursor.translate(str.maketrans("-_", "+/"))
            raw = json.loads(base64.b64decode(normalized.encode(), validate=True))
            if not isinstance(raw, list) or len(raw) != 2 or not all(isinstance(v, str) for v in raw):
                raise ValueError("Invalid cursor shape")
            timestamp = datetime.fromisoformat(raw[0])
            if len(raw[1]) != 36 or str(UUID(raw[1])) != raw[1]:
                raise ValueError("Invalid cursor ID")
            query = query.where(tuple_(Event.observed_at, Event.id) < (timestamp, raw[1]))
        except Exception as exc:
            raise HTTPException(422, "Invalid event cursor.") from exc
    events = list(db.scalars(query.order_by(Event.observed_at.desc(), Event.id.desc()).limit(limit + 1)))
    more = len(events) > limit
    events = events[:limit]
    return {"items": events, "next_cursor": encode_cursor(events[-1]) if more else None}


@router.get("/events/{event_id}", response_model=EventOut)
def read_event(event_id: str, db: DB, user: CurrentUser) -> Event:
    return get_event(db, user, event_id)


@router.post("/events/{event_id}/reviews", response_model=EventOut)
def review_event(
    event_id: str,
    body: ReviewCreate,
    request: Request,
    db: DB,
    user: Annotated[CurrentUser, Depends(require("event:review"))],
) -> Event:
    csrf(request, db, user)
    event = get_event(db, user, event_id)
    changed = db.execute(
        update(Event)
        .where(Event.id == event.id, Event.version == body.version, Event.review_status != "confirmed")
        .values(review_status=body.decision, version=Event.version + 1)
        .returning(Event.id)
        .execution_options(synchronize_session="fetch")
    ).scalar_one_or_none()
    if changed is None:
        raise HTTPException(409, "This event changed or was confirmed. Refresh before reviewing.")
    db.refresh(event)
    db.add(Review(event_id=event.id, actor_id=user.id, decision=body.decision, rationale=body.rationale))
    audit(db, user, "event.review", "event", event.id, f"Human review: {body.decision}.")
    db.commit()
    return event


@router.post("/incidents", response_model=IncidentOut, status_code=201)
def confirm_incident(
    body: IncidentCreate,
    request: Request,
    db: DB,
    user: Annotated[CurrentUser, Depends(require("incident:confirm"))],
) -> Incident:
    csrf(request, db, user)
    event = get_event(db, user, body.event_id)
    changed = db.execute(
        update(Event)
        .where(
            Event.id == event.id,
            Event.version == body.event_version,
            Event.review_status.not_in(["confirmed", "false_positive"]),
        )
        .values(review_status="confirmed", version=Event.version + 1)
        .returning(Event.id)
        .execution_options(synchronize_session="fetch")
    ).scalar_one_or_none()
    if changed is None:
        raise HTTPException(
            409, "This event changed, was dismissed, or already has an incident. Refresh first."
        )
    db.refresh(event)
    incident = Incident(
        event_id=event.id,
        camera_id=event.camera_id,
        title=body.title,
        severity=body.severity,
        rationale=body.rationale,
        confirmed_by=user.id,
    )
    db.add(incident)
    db.flush()
    db.add(Review(event_id=event.id, actor_id=user.id, decision="confirmed", rationale=body.rationale))
    audit(
        db,
        user,
        "incident.confirm",
        "incident",
        incident.id,
        "Explicit human confirmation of synthetic event.",
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(409, "An incident already exists for this event.") from exc
    return incident


@router.get("/incidents", response_model=Items[IncidentOut])
def list_incidents(db: DB, user: CurrentUser) -> dict[str, object]:
    query = select(Incident).order_by(Incident.confirmed_at.desc()).limit(100)
    query = query.where(Incident.camera_id.in_(grant_ids(db, user)))
    return {"items": list(db.scalars(query))}
