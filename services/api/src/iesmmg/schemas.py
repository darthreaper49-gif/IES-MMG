from datetime import UTC, datetime
from typing import Annotated, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, PlainSerializer

UtcDatetime = Annotated[
    datetime,
    PlainSerializer(
        lambda value: (
            (value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC))
            .isoformat()
            .replace("+00:00", "Z")
        ),
        return_type=str,
    ),
]

Role = Literal["viewer", "security_operator", "administrator"]
Severity = Literal["low", "medium", "high", "critical"]
Health = Literal["online", "degraded", "offline", "unknown"]


class Schema(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")


class Login(Schema):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


class UserOut(Schema):
    id: str
    username: str
    display_name: str
    role: Role
    active: bool
    permissions: list[str]
    camera_ids: list[str] | None


class SessionOut(Schema):
    user: UserOut
    csrf_token: str
    environment: str


class CameraOut(Schema):
    id: str
    name: str
    location: str
    group_id: str
    source_type: str
    environment: str
    status: Health
    enabled: bool
    scene: int
    last_seen_at: UtcDatetime | None
    version: int


class CameraCreate(Schema):
    name: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=120)
    group_id: str = Field(min_length=1, max_length=36)
    source_type: Literal["simulation"] = "simulation"


class CameraUpdate(Schema):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, min_length=2, max_length=120)
    enabled: bool | None = None
    version: int = Field(ge=1)


class GroupOut(Schema):
    id: str
    name: str


class EventOut(Schema):
    id: str
    camera_id: str
    kind: str
    category: str
    severity: Severity
    confidence: float | None
    zone: str
    environment: str
    detector: str
    model_version: str
    review_status: str
    observed_at: UtcDatetime
    received_at: UtcDatetime
    version: int


class ReviewCreate(Schema):
    decision: Literal["false_positive", "needs_investigation"]
    rationale: str = Field(min_length=8, max_length=1000)
    version: int = Field(ge=1)


class IncidentCreate(Schema):
    event_id: str = Field(min_length=36, max_length=36)
    title: str = Field(min_length=4, max_length=160)
    rationale: str = Field(min_length=8, max_length=1000)
    severity: Severity
    event_version: int = Field(ge=1)


class IncidentOut(Schema):
    id: str
    event_id: str
    camera_id: str
    title: str
    severity: Severity
    status: str
    confirmed_by: str
    rationale: str
    confirmed_at: UtcDatetime


class AuditOut(Schema):
    id: str
    actor_id: str | None
    action: str
    resource_type: str
    resource_id: str
    detail: str
    created_at: UtcDatetime


class StreamOut(Schema):
    mode: Literal["simulation", "unavailable"]
    camera_id: str
    expires_at: UtcDatetime
    message: str


class SummaryOut(Schema):
    cameras_total: int = Field(ge=0)
    cameras_online: int = Field(ge=0)
    cameras_degraded: int = Field(ge=0)
    cameras_offline: int = Field(ge=0)
    pending_reviews: int = Field(ge=0)
    confirmed_incidents: int = Field(ge=0)
    environment: Literal["simulation"]


class SystemHealthOut(Schema):
    status: Literal["ok", "degraded"]
    environment: Literal["simulation"]
    api: Literal["available"]
    database: Literal["available", "unavailable"]
    camera_adapter: Literal["synthetic"]
    video_gateway: Literal["not_connected"]
    ai_model: Literal["not_connected"]
    recording: Literal["disabled"]


T = TypeVar("T")


class Items(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)
    items: list[T]


class EventPage(Schema):
    items: list[EventOut]
    next_cursor: str | None
