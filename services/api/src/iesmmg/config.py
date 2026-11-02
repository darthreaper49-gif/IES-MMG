from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="IESMMG_", env_file=".env", extra="ignore")

    env: Literal["demo", "test"] = "demo"
    database_url: str = "sqlite:///./data/iesmmg-demo.db"
    simulation_interval_seconds: int = Field(default=45, ge=10, le=3600)
    session_hours: int = Field(default=8, ge=1, le=24)
    secure_cookies: bool = False
    extra_origin: str = ""
    simulate: bool = True

    def prepare_database(self) -> None:
        if self.database_url.startswith("sqlite:///"):
            path = Path(self.database_url.removeprefix("sqlite:///"))
            if str(path) != ":memory:":
                path.parent.mkdir(parents=True, exist_ok=True)


settings = Settings()
