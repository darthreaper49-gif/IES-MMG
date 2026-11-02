"""Export the actual application contract without opening a database or starting a server."""

import argparse
import json
from pathlib import Path

from iesmmg.config import Settings
from iesmmg.main import create_app

CONTRACT = Path(__file__).resolve().parents[3] / "contracts" / "openapi.json"


def render_contract() -> str:
    app = create_app(Settings(env="test", database_url="sqlite:///:memory:", simulate=False))
    return json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Fail if the checked-in contract is stale.")
    args = parser.parse_args()
    rendered = render_contract()
    if args.check:
        if not CONTRACT.exists() or CONTRACT.read_text() != rendered:
            raise SystemExit(
                "Contract is stale. Run: PYTHONPATH=src .venv/bin/python scripts/export_openapi.py"
            )
        print(f"Contract matches the application: {CONTRACT}")
    else:
        CONTRACT.parent.mkdir(parents=True, exist_ok=True)
        CONTRACT.write_text(rendered)
        print(f"Exported {CONTRACT}")


if __name__ == "__main__":
    main()
