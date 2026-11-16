
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.routers.candidate_profile import router as candidate_profile_router
from app.models.application import Application
from app.routers.applications import router as applications_router
from app.models.candidate_profile import CandidateProfile
from app.database import Base, engine, get_db
from app.models.user import User
from app.routers.auth import router as auth_router
from app.models.job import Job
from app.routers.jobs import router as jobs_router
from app.routers import analytics
from app.models.interview import Interview
from app.routers import interviews
# Create tables for imported models
# Use Alembic migrations for production.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Portal API",
    description="React + FastAPI Recruitment Management System",
    version="1.0.0",
)

# Allow requests from the local React + Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication endpoints
app.include_router(auth_router)
app.include_router(jobs_router)
app.include_router(applications_router)
app.include_router(candidate_profile_router)
app.include_router(analytics.router)
app.include_router(interviews.router)


@app.get("/")
def home():
    return {"message": "Job Portal API is running"}


@app.get("/health/db")
def check_database(db: Session = Depends(get_db)):
    try:
        result = db.execute(text("SELECT 1")).scalar_one()
        return {
            "database": "connected",
            "test_result": result,
        }
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )
