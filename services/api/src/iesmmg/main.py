import asyncio
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response

from .config import Settings, settings
from .database import make_engine, session_factory
from .models import Base
from .routers import admin, auth, cameras, events, system
from .seed import seed
from .simulation import simulation_loop


def create_app(config: Settings | None = None) -> FastAPI:
    config = config or settings
    if config.env not in {"demo", "test"}:
        raise RuntimeError("This foundation is simulation-only. Production startup is not supported.")
    engine = make_engine(config)
    sessions = session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # Demo bootstrap only. PostgreSQL deployment must use reviewed Alembic migrations.
        Base.metadata.create_all(engine)
        with sessions() as db:
            seed(db)
        stop = asyncio.Event()
        task = None
        if config.simulate and config.env == "demo":
            task = asyncio.create_task(simulation_loop(sessions, config.simulation_interval_seconds, stop))
        yield
        stop.set()
        if task:
            await task
        engine.dispose()

    app = FastAPI(
        title="IESMMG Simulation API",
        version="0.1.0",
        description="Synthetic data only. No real cameras, footage, biometrics, or production authorization.",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/docs",
        redoc_url=None,
        lifespan=lifespan,
    )
    app.state.settings = config
    app.state.sessions = sessions
    app.state.engine = engine

    @app.middleware("http")
    async def security_headers(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-Request-ID"] = uuid4().hex
        response.headers["Cache-Control"] = "no-store"
        if config.secure_cookies:
            response.headers["Strict-Transport-Security"] = "max-age=31536000"
        return response

    @app.exception_handler(HTTPException)
    async def http_problem(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "type": "about:blank",
                "title": "Request rejected",
                "status": exc.status_code,
                "detail": exc.detail,
            },
            media_type="application/problem+json",
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_problem(request: Request, exc: RequestValidationError) -> JSONResponse:
        fields = [{"field": ".".join(str(x) for x in e["loc"]), "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=422,
            content={
                "type": "about:blank",
                "title": "Validation failed",
                "status": 422,
                "detail": "Check the submitted fields.",
                "fields": fields,
            },
            media_type="application/problem+json",
        )

    for router in [auth.router, cameras.router, events.router, admin.router, system.router]:
        app.include_router(router, prefix="/api/v1")
    return app


app = create_app()
