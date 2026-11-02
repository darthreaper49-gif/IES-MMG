from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, update

from ..models import Camera, CameraGrant, CameraGroup, now
from ..schemas import CameraCreate, CameraOut, CameraUpdate, GroupOut, Items, StreamOut
from ..security import DB, CurrentUser, accessible_camera, audit, csrf, grant_ids, require

router = APIRouter(tags=["Cameras"])


@router.get("/cameras", response_model=Items[CameraOut])
def list_cameras(db: DB, user: CurrentUser) -> dict[str, object]:
    query = select(Camera).order_by(Camera.created_at, Camera.id)
    if user.role != "administrator":
        query = query.where(Camera.id.in_(grant_ids(db, user)))
    return {"items": list(db.scalars(query))}


@router.post("/cameras", response_model=CameraOut, status_code=201)
def create_camera(
    body: CameraCreate,
    request: Request,
    db: DB,
    user: Annotated[CurrentUser, Depends(require("camera:manage"))],
) -> Camera:
    csrf(request, db, user)
    if db.get(CameraGroup, body.group_id) is None:
        raise HTTPException(422, "Select an existing camera group.")
    camera = Camera(**body.model_dump(), status="unknown")
    db.add(camera)
    db.flush()
    db.add(CameraGrant(user_id=user.id, camera_id=camera.id))
    audit(db, user, "camera.create", "camera", camera.id, "Synthetic camera registered.")
    db.commit()
    return camera


@router.get("/camera-groups", response_model=Items[GroupOut])
def groups(db: DB, user: CurrentUser) -> dict[str, object]:
    return {"items": list(db.scalars(select(CameraGroup).order_by(CameraGroup.name)))}


@router.get("/cameras/{camera_id}", response_model=CameraOut)
def get_camera(camera_id: str, db: DB, user: CurrentUser) -> Camera:
    return accessible_camera(db, user, camera_id, "camera:read")


@router.patch("/cameras/{camera_id}", response_model=CameraOut)
def update_camera(
    camera_id: str,
    body: CameraUpdate,
    request: Request,
    db: DB,
    user: Annotated[CurrentUser, Depends(require("camera:manage"))],
) -> Camera:
    csrf(request, db, user)
    camera = accessible_camera(db, user, camera_id, "camera:manage")
    values = body.model_dump(exclude_unset=True, exclude={"version"})
    changed = db.execute(
        update(Camera)
        .where(Camera.id == camera.id, Camera.version == body.version)
        .values(**values, version=Camera.version + 1)
        .returning(Camera.id)
        .execution_options(synchronize_session="fetch")
    ).scalar_one_or_none()
    if changed is None:
        raise HTTPException(409, "Camera changed. Refresh before saving.")
    db.refresh(camera)
    audit(db, user, "camera.update", "camera", camera.id, "Synthetic camera configuration updated.")
    db.commit()
    return camera


@router.post("/cameras/{camera_id}/connection-tests", response_model=CameraOut)
def connection_test(
    camera_id: str, request: Request, db: DB, user: Annotated[CurrentUser, Depends(require("camera:manage"))]
) -> Camera:
    csrf(request, db, user)
    camera = accessible_camera(db, user, camera_id, "camera:manage")
    # This adapter never opens a socket or accepts a user-supplied URL.
    camera.last_seen_at = now() if camera.status in {"online", "degraded"} else camera.last_seen_at
    audit(
        db,
        user,
        "camera.simulation_check",
        "camera",
        camera.id,
        "Synthetic health fixture checked; no network connection attempted.",
    )
    db.commit()
    return camera


@router.post("/cameras/{camera_id}/stream-sessions", response_model=StreamOut)
def stream_session(camera_id: str, request: Request, db: DB, user: CurrentUser) -> dict[str, object]:
    csrf(request, db, user)
    camera = accessible_camera(db, user, camera_id, "stream:view")
    available = camera.enabled and camera.status in {"online", "degraded"}
    audit(
        db,
        user,
        "stream.authorize",
        "camera",
        camera.id,
        "Synthetic viewport authorization checked.",
    )
    db.commit()
    return {
        "mode": "simulation" if available else "unavailable",
        "camera_id": camera.id,
        "expires_at": now() + timedelta(minutes=5),
        "message": "Synthetic scene only. No camera feed or real footage is connected.",
    }
