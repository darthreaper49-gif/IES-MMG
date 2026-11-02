from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from iesmmg.config import Settings
from iesmmg.main import create_app
from iesmmg.security import _login_attempts


@pytest.fixture
def client() -> Iterator[TestClient]:
    _login_attempts.clear()
    app = create_app(Settings(env="test", database_url="sqlite+pysqlite:///:memory:", simulate=False))
    with TestClient(app) as client:
        yield client


def login(client: TestClient, role: str = "operator") -> str:
    token = client.get("/api/v1/auth/csrf").json()["csrf_token"]
    passwords = {"operator": "Operator!2026", "viewer": "Viewer!2026", "admin": "Admin!2026"}
    response = client.post(
        "/api/v1/auth/session",
        json={"username": role, "password": passwords[role]},
        headers={"X-CSRF-Token": token},
    )
    assert response.status_code == 200, response.text
    return response.json()["csrf_token"]
