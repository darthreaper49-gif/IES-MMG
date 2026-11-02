from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Camera, CameraGrant, CameraGroup, Event, User, now
from .security import hasher

# Public fixtures, never production credentials. Production startup is rejected.
DEMO_ACCOUNTS = [
    ("operator", "Alex Morgan", "security_operator", "Operator!2026"),
    ("viewer", "Sam Rivera", "viewer", "Viewer!2026"),
    ("admin", "Jordan Lee", "administrator", "Admin!2026"),
]
CAMERAS = [
    ("Main entrance", "Building A · Ground floor", "Access points", "online", 0),
    ("Central courtyard", "Building B · Outdoor area", "Outdoor", "online", 1),
    ("Library corridor", "Building A · First floor", "Indoor", "online", 2),
    ("Sports court", "North campus · Outdoor area", "Outdoor", "degraded", 3),
    ("Parking area", "East campus · Vehicle access", "Outdoor", "online", 4),
    ("Science hallway", "Building C · Ground floor", "Indoor", "offline", 5),
    ("Workshop entrance", "Building C · Workshop", "Access points", "unknown", 6),
    ("Rear entrance", "South campus · Service access", "Access points", "online", 7),
]


def seed(db: Session) -> None:
    if db.scalar(select(User.id).limit(1)):
        return
    users = []
    for username, name, role, password in DEMO_ACCOUNTS:
        user = User(username=username, display_name=name, role=role, password_hash=hasher.hash(password))
        db.add(user)
        users.append(user)
    groups = {}
    for name in ["Access points", "Outdoor", "Indoor"]:
        group = CameraGroup(name=name)
        db.add(group)
        groups[name] = group
    db.flush()
    cameras = []
    for name, location, group_name, status, scene in CAMERAS:
        camera = Camera(
            name=name,
            location=location,
            group_id=groups[group_name].id,
            status=status,
            scene=scene,
            last_seen_at=now() - timedelta(seconds=12) if status != "unknown" else None,
        )
        db.add(camera)
        cameras.append(camera)
    db.flush()
    for user in users:
        granted = (
            cameras[:6]
            if user.role == "security_operator"
            else cameras[:4]
            if user.role == "viewer"
            else [cameras[0]]
        )
        for camera in granted:
            db.add(CameraGrant(user_id=user.id, camera_id=camera.id))
    fixtures = [
        (0, "Motion detected", "motion", "medium", 0.94, "Entrance zone", 2),
        (1, "Person in monitored zone", "person", "high", 0.91, "Courtyard perimeter", 5),
        (4, "Vehicle activity", "vehicle", "low", 0.88, "Vehicle access", 9),
        (3, "Connection instability", "connection", "medium", None, "Stream diagnostics", 14),
        (2, "Motion detected", "motion", "low", 0.82, "Corridor zone", 21),
        (5, "Camera disconnected", "connection", "high", None, "Stream diagnostics", 28),
        (0, "Person in monitored zone", "person", "medium", 0.89, "Entrance zone", 35),
        (1, "Motion outside schedule", "motion", "high", 0.96, "Courtyard perimeter", 43),
    ]
    for index, (camera_index, kind, category, severity, confidence, zone, minutes) in enumerate(fixtures):
        db.add(
            Event(
                camera_id=cameras[camera_index].id,
                kind=kind,
                category=category,
                severity=severity,
                confidence=confidence,
                zone=zone,
                observed_at=now() - timedelta(minutes=minutes),
                received_at=now() - timedelta(minutes=minutes),
                deduplication_key=f"seed-{index}",
            )
        )
    db.commit()
