"""Bounded synthetic adapter. It never opens a camera or network connection."""

import asyncio

from sqlalchemy import func, select
from sqlalchemy.orm import Session, sessionmaker

from .models import Camera, Event, now

FIXTURES = [
    ("Motion detected", "motion", "medium", 0.93, "Monitored zone"),
    ("Person in monitored zone", "person", "high", 0.89, "Perimeter zone"),
    ("Vehicle activity", "vehicle", "low", 0.86, "Access zone"),
]


def generate_event(sessions: sessionmaker[Session], sequence: int) -> str | None:
    with sessions() as db:
        cameras = list(
            db.scalars(
                select(Camera)
                .where(
                    Camera.enabled.is_(True),
                    Camera.source_type == "simulation",
                    Camera.status.in_(["online", "degraded"]),
                )
                .order_by(Camera.created_at, Camera.id)
            )
        )
        if not cameras or (db.scalar(select(func.count()).select_from(Event)) or 0) >= 500:
            return None
        camera = cameras[sequence % len(cameras)]
        kind, category, severity, confidence, zone = FIXTURES[sequence % len(FIXTURES)]
        event = Event(
            camera_id=camera.id,
            kind=kind,
            category=category,
            severity=severity,
            confidence=confidence,
            zone=zone,
            observed_at=now(),
            deduplication_key=f"simulation-{sequence}-{now().isoformat()}",
        )
        db.add(event)
        camera.last_seen_at = now()
        db.commit()
        return event.id


async def simulation_loop(sessions: sessionmaker[Session], interval: int, stop: asyncio.Event) -> None:
    sequence = 0
    while not stop.is_set():
        try:
            await asyncio.wait_for(stop.wait(), timeout=interval)
        except TimeoutError:
            generate_event(sessions, sequence)
            sequence += 1
