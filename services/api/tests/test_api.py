from conftest import login
from fastapi.testclient import TestClient

from iesmmg.config import Settings
from iesmmg.main import create_app
from iesmmg.security import _login_attempts


def test_unauthenticated_and_health(client: TestClient) -> None:
    assert client.get("/api/v1/cameras").status_code == 401
    health = client.get("/api/v1/system/health").json()
    assert health["database"] == "available"
    assert health["video_gateway"] == "not_connected"
    assert health["recording"] == "disabled"


def test_login_csrf_and_session_rotation(client: TestClient) -> None:
    assert (
        client.post(
            "/api/v1/auth/session", json={"username": "operator", "password": "Operator!2026"}
        ).status_code
        == 403
    )
    csrf = login(client)
    old = client.cookies.get("iesmmg_session")
    me = client.get("/api/v1/auth/me")
    assert me.json()["role"] == "security_operator"
    assert "password_hash" not in me.text
    assert client.delete("/api/v1/auth/session", headers={"X-CSRF-Token": csrf}).status_code == 204
    assert client.get("/api/v1/cameras").status_code == 401
    login(client)
    assert client.cookies.get("iesmmg_session") != old


def test_wrong_password_and_throttle(client: TestClient) -> None:
    for _ in range(9):
        token = client.get("/api/v1/auth/csrf").json()["csrf_token"]
        result = client.post(
            "/api/v1/auth/session",
            json={"username": "operator", "password": "wrong"},
            headers={"X-CSRF-Token": token},
        )
    assert result.status_code == 429
    _login_attempts.clear()


def test_camera_grants_and_admin_metadata_boundary(client: TestClient) -> None:
    login(client, "viewer")
    cameras = client.get("/api/v1/cameras").json()["items"]
    assert len(cameras) == 4
    assert (
        client.post(
            "/api/v1/cameras", json={"name": "Forbidden", "location": "Test", "group_id": "x"}
        ).status_code
        == 403
    )
    client.delete(
        "/api/v1/auth/session",
        headers={"X-CSRF-Token": client.get("/api/v1/auth/session").json()["csrf_token"]},
    )
    login(client, "admin")
    all_cameras = client.get("/api/v1/cameras").json()["items"]
    assert len(all_cameras) == 8
    hidden = all_cameras[-1]
    assert client.post(f"/api/v1/cameras/{hidden['id']}/stream-sessions").status_code == 403
    admin_events = client.get("/api/v1/events").json()["items"]
    assert len(admin_events) == 2
    assert all(event["camera_id"] == all_cameras[0]["id"] for event in admin_events)


def test_synthetic_only_registration_and_optimistic_concurrency(client: TestClient) -> None:
    csrf = login(client, "admin")
    headers = {"X-CSRF-Token": csrf}
    group = client.get("/api/v1/camera-groups").json()["items"][0]
    result = client.post(
        "/api/v1/cameras",
        json={
            "name": "Synthetic test",
            "location": "Test zone",
            "group_id": group["id"],
            "source_type": "rtsp",
            "url": "rtsp://example.invalid",
        },
        headers=headers,
    )
    assert result.status_code == 422
    result = client.post(
        "/api/v1/cameras",
        json={"name": "Synthetic test", "location": "Test zone", "group_id": group["id"]},
        headers=headers,
    )
    assert result.status_code == 201
    camera = result.json()
    assert camera["status"] == "unknown"
    assert camera["environment"] == "simulation"
    updated = client.patch(
        f"/api/v1/cameras/{camera['id']}", json={"enabled": False, "version": 1}, headers=headers
    )
    assert updated.status_code == 200
    assert (
        client.patch(
            f"/api/v1/cameras/{camera['id']}", json={"enabled": True, "version": 1}, headers=headers
        ).status_code
        == 409
    )


def test_review_is_not_incident_and_confirmation_is_explicit(client: TestClient) -> None:
    csrf = login(client)
    headers = {"X-CSRF-Token": csrf}
    event = client.get("/api/v1/events").json()["items"][0]
    assert event["review_status"] == "pending"
    assert client.get("/api/v1/incidents").json()["items"] == []
    payload = {
        "decision": "confirmed",
        "rationale": "Human verified this fixture.",
        "version": event["version"],
    }
    assert (
        client.post(f"/api/v1/events/{event['id']}/reviews", json=payload, headers=headers).status_code == 422
    )
    payload["decision"] = "needs_investigation"
    reviewed = client.post(f"/api/v1/events/{event['id']}/reviews", json=payload, headers=headers)
    assert reviewed.status_code == 200
    assert client.get("/api/v1/incidents").json()["items"] == []
    incident = client.post(
        "/api/v1/incidents",
        json={
            "event_id": event["id"],
            "title": "Synthetic review test",
            "rationale": "Explicitly confirmed by the demo operator.",
            "severity": "medium",
            "event_version": reviewed.json()["version"],
        },
        headers=headers,
    )
    assert incident.status_code == 201, incident.text
    assert incident.json()["confirmed_by"]
    assert len(client.get("/api/v1/incidents").json()["items"]) == 1
    audit = client.get("/api/v1/admin/audit-events")
    assert audit.status_code == 403


def test_viewer_cannot_review_and_cross_camera_event_denied(client: TestClient) -> None:
    login(client, "admin")
    cameras = client.get("/api/v1/cameras").json()["items"]
    hidden_id = cameras[5]["id"]
    client.delete(
        "/api/v1/auth/session",
        headers={"X-CSRF-Token": client.get("/api/v1/auth/session").json()["csrf_token"]},
    )
    csrf = login(client, "viewer")
    event = client.get("/api/v1/events").json()["items"][0]
    assert (
        client.post(
            f"/api/v1/events/{event['id']}/reviews",
            json={"decision": "false_positive", "rationale": "Not permitted for viewer.", "version": 1},
            headers={"X-CSRF-Token": csrf},
        ).status_code
        == 403
    )
    assert client.get(f"/api/v1/cameras/{hidden_id}").status_code == 404
    assert all(
        e["camera_id"] != hidden_id
        for e in client.get("/api/v1/events", params={"limit": 100}).json()["items"]
    )


def test_event_filters_cursor_and_validation(client: TestClient) -> None:
    login(client)
    first = client.get("/api/v1/events", params={"limit": 3}).json()
    assert len(first["items"]) == 3 and first["next_cursor"]
    second = client.get("/api/v1/events", params={"limit": 3, "cursor": first["next_cursor"]}).json()
    assert not set(e["id"] for e in first["items"]) & set(e["id"] for e in second["items"])
    assert client.get("/api/v1/events", params={"cursor": "invalid"}).status_code == 422
    assert client.get("/api/v1/events", params={"limit": 1000}).status_code == 422
    assert client.get("/api/v1/events", params={"severity": "urgent"}).status_code == 422
    assert all(
        e["severity"] == "high"
        for e in client.get("/api/v1/events", params={"severity": "high"}).json()["items"]
    )


def test_stream_session_is_synthetic_and_unavailable(client: TestClient) -> None:
    csrf = login(client)
    cameras = client.get("/api/v1/cameras").json()["items"]
    headers = {"X-CSRF-Token": csrf}
    response = client.post(f"/api/v1/cameras/{cameras[0]['id']}/stream-sessions", headers=headers)
    assert response.json()["mode"] == "simulation"
    assert "rtsp" not in response.text
    offline = next(c for c in cameras if c["status"] == "offline")
    assert (
        client.post(f"/api/v1/cameras/{offline['id']}/stream-sessions", headers=headers).json()["mode"]
        == "unavailable"
    )


def test_origin_rejection_and_audit(client: TestClient) -> None:
    csrf = login(client)
    assert (
        client.post(
            "/api/v1/cameras", json={}, headers={"X-CSRF-Token": csrf, "Origin": "https://untrusted.invalid"}
        ).status_code
        == 403
    )
    client.delete("/api/v1/auth/session", headers={"X-CSRF-Token": csrf})
    login(client, "admin")
    actions = [e["action"] for e in client.get("/api/v1/admin/audit-events").json()["items"]]
    assert "session.login" in actions and "session.logout" in actions


def test_production_startup_rejected() -> None:
    import pytest

    with pytest.raises(ValueError, match="demo.*test"):
        create_app(Settings(env="production"))


def test_openapi_and_security_headers(client: TestClient) -> None:
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    assert "/api/v1/incidents" in response.json()["paths"]
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["cache-control"] == "no-store"


def test_summary_uses_grants_for_every_role(client: TestClient) -> None:
    for role, total, pending in [("operator", 6, 8), ("viewer", 4, 6), ("admin", 1, 2)]:
        login(client, role)
        summary = client.get("/api/v1/system/summary").json()
        assert summary["cameras_total"] == total
        assert summary["pending_reviews"] == pending
        assert summary["confirmed_incidents"] == 0
        assert summary["environment"] == "simulation"
        client.delete(
            "/api/v1/auth/session",
            headers={"X-CSRF-Token": client.get("/api/v1/auth/session").json()["csrf_token"]},
        )


def test_cursor_traverses_more_than_fifty_events_without_duplicates(client: TestClient) -> None:
    from iesmmg.simulation import generate_event

    login(client)
    sessions = client.app.state.sessions
    for sequence in range(72):
        assert generate_event(sessions, sequence) is not None
    allowed = {camera["id"] for camera in client.get("/api/v1/cameras").json()["items"]}
    seen: list[str] = []
    cursor = None
    for _ in range(5):
        params = {"limit": 20}
        if cursor:
            params["cursor"] = cursor
        page = client.get("/api/v1/events", params=params).json()
        assert all(event["camera_id"] in allowed for event in page["items"])
        seen.extend(event["id"] for event in page["items"])
        cursor = page["next_cursor"]
        if cursor is None:
            break
    assert cursor is None
    # Six eligible simulation cameras, but the operator is not granted camera 7.
    # Five eligible granted cameras produce 60 new events plus 8 seeded events.
    assert len(seen) == 68
    assert len(set(seen)) == len(seen)
    assert client.get("/api/v1/events", params={"cursor": "x" * 513}).status_code == 422


def test_stale_review_and_duplicate_incident_are_rejected(client: TestClient) -> None:
    csrf = login(client)
    headers = {"X-CSRF-Token": csrf}
    events = client.get("/api/v1/events").json()["items"]
    event = events[0]
    body = {"decision": "needs_investigation", "rationale": "First human assessment.", "version": 1}
    assert client.post(f"/api/v1/events/{event['id']}/reviews", json=body, headers=headers).status_code == 200
    assert client.post(f"/api/v1/events/{event['id']}/reviews", json=body, headers=headers).status_code == 409
    confirmation = {
        "event_id": event["id"],
        "title": "One explicit incident",
        "severity": "medium",
        "rationale": "Authorized synthetic confirmation.",
        "event_version": 2,
    }
    assert client.post("/api/v1/incidents", json=confirmation, headers=headers).status_code == 201
    assert client.post("/api/v1/incidents", json=confirmation, headers=headers).status_code == 409
    assert (
        client.post(
            f"/api/v1/events/{event['id']}/reviews", json={**body, "version": 3}, headers=headers
        ).status_code
        == 409
    )
    assert client.get(f"/api/v1/events/{event['id']}").json()["version"] == 3
    dismissed = events[1]
    assert (
        client.post(
            f"/api/v1/events/{dismissed['id']}/reviews",
            json={**body, "decision": "false_positive"},
            headers=headers,
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/incidents",
            json={**confirmation, "event_id": dismissed["id"], "event_version": 2},
            headers=headers,
        ).status_code
        == 409
    )


def test_csrf_is_session_bound_and_origin_port_is_checked(client: TestClient) -> None:
    operator_csrf = login(client)
    with TestClient(client.app) as other:
        admin_csrf = login(other, "admin")
        other.cookies.set("iesmmg_session", client.cookies.get("iesmmg_session"))
        assert other.post("/api/v1/cameras", json={}, headers={"X-CSRF-Token": admin_csrf}).status_code == 403
        assert (
            other.post(
                "/api/v1/cameras",
                json={},
                headers={"X-CSRF-Token": operator_csrf, "Origin": "http://testserver:9999"},
            ).status_code
            == 403
        )


def test_expired_session_cannot_read_or_stream(client: TestClient) -> None:
    from datetime import UTC, datetime

    from sqlalchemy import update

    from iesmmg.models import Session as AuthSession
    from iesmmg.security import token_hash

    login(client)
    with client.app.state.sessions() as db:
        db.execute(
            update(AuthSession)
            .where(AuthSession.token_hash == token_hash(client.cookies.get("iesmmg_session")))
            .values(expires_at=datetime(2020, 1, 1, tzinfo=UTC))
        )
        db.commit()
    assert client.get("/api/v1/cameras").status_code == 401
    assert client.get("/api/v1/system/event-updates").status_code == 401


def test_sse_is_scoped_and_stops_after_session_revocation(client: TestClient) -> None:
    from sqlalchemy import delete

    from iesmmg.models import Session as AuthSession

    assert client.get("/api/v1/system/event-updates").status_code == 401
    login(client)
    with client.stream("GET", "/api/v1/system/event-updates") as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        lines = response.iter_lines()
        assert next(lines) == "event: update"
        assert next(lines) == 'data: {"source": "simulation"}'
        with client.app.state.sessions() as db:
            db.execute(delete(AuthSession))
            db.commit()
        assert [line for line in lines if line] == []


def test_timestamps_are_explicitly_utc(client: TestClient) -> None:
    login(client)
    event = client.get("/api/v1/events").json()["items"][0]
    assert event["observed_at"].endswith("Z")
    assert event["received_at"].endswith("Z")


def test_successful_login_clears_failure_budget_and_malformed_origin_is_rejected(client: TestClient) -> None:
    for _ in range(3):
        token = client.get("/api/v1/auth/csrf").json()["csrf_token"]
        assert (
            client.post(
                "/api/v1/auth/session",
                json={"username": "operator", "password": "wrong"},
                headers={"X-CSRF-Token": token},
            ).status_code
            == 401
        )
    assert _login_attempts
    csrf = login(client)
    assert not _login_attempts
    assert (
        client.post(
            "/api/v1/cameras", json={}, headers={"X-CSRF-Token": csrf, "Origin": "http://[invalid"}
        ).status_code
        == 403
    )


def test_secure_cookie_policy_applies_to_bootstrap_and_session(client: TestClient) -> None:
    client.app.state.settings.secure_cookies = True
    try:
        with TestClient(client.app, base_url="https://testserver") as secure_client:
            bootstrap = secure_client.get("/api/v1/auth/csrf")
            assert "secure" in bootstrap.headers["set-cookie"].lower()
            response = secure_client.post(
                "/api/v1/auth/session",
                json={"username": "operator", "password": "Operator!2026"},
                headers={"X-CSRF-Token": bootstrap.json()["csrf_token"]},
            )
            assert response.status_code == 200
            for cookie in response.headers.get_list("set-cookie"):
                assert "httponly" in cookie.lower()
                assert "secure" in cookie.lower()
                assert "samesite=lax" in cookie.lower()
            assert response.headers["strict-transport-security"]
    finally:
        client.app.state.settings.secure_cookies = False
