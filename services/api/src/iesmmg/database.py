from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from .config import Settings


def make_engine(settings: Settings) -> Engine:
    settings.prepare_database()
    sqlite = settings.database_url.startswith("sqlite")
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False} if sqlite else {},
        poolclass=StaticPool if ":memory:" in settings.database_url else None,
    )
    if sqlite:

        @event.listens_for(engine, "connect")
        def sqlite_pragmas(dbapi_connection: object, _record: object) -> None:
            cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    return engine


def session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(engine, expire_on_commit=False)
