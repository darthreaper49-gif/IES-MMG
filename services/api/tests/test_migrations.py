from pathlib import Path

from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from iesmmg.config import settings
from iesmmg.models import Base


def test_sqlite_upgrade_downgrade_and_schema_match(tmp_path: Path, monkeypatch) -> None:
    root = Path(__file__).resolve().parents[1]
    database = tmp_path / "migration-test.db"
    monkeypatch.setattr(settings, "database_url", f"sqlite:///{database}")
    config = Config(str(root / "alembic.ini"))
    command.upgrade(config, "head")
    engine = create_engine(settings.database_url)
    with engine.connect() as connection:
        context = MigrationContext.configure(connection, opts={"compare_type": True})
        assert compare_metadata(context, Base.metadata) == []
    engine.dispose()
    command.downgrade(config, "base")
    engine = create_engine(settings.database_url)
    assert inspect(engine).get_table_names() == ["alembic_version"]
    engine.dispose()
    command.upgrade(config, "head")
