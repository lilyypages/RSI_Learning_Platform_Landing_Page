from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.database import engine, Base
from src.routers.auth_router import router as auth_router
from src.routers.progress_router import router as progress_router
from src.routers.analytics_router import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SIPANDA API",
    description="Sistem Informasi Pembelajaran Adaptif berbasis Analitik Kemajuan Siswa",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(progress_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "app": "SIPANDA",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
