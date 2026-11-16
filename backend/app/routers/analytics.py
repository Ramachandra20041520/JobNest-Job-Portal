from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.application import Application
from app.models.job import Job
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/recruiter/dashboard")
def get_recruiter_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can access dashboard analytics.",
        )

    # Count only jobs owned by the logged-in recruiter.
    total_jobs = (
        db.query(func.count(Job.id))
        .filter(Job.recruiter_id == current_user.id)
        .scalar()
        or 0
    )

    published_jobs = (
        db.query(func.count(Job.id))
        .filter(
            Job.recruiter_id == current_user.id,
            Job.status == "published",
        )
        .scalar()
        or 0
    )

    # Count applications only for this recruiter's jobs.
    total_applications = (
        db.query(func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.recruiter_id == current_user.id)
        .scalar()
        or 0
    )

    def count_applications_by_status(application_status: str) -> int:
        return (
            db.query(func.count(Application.id))
            .join(Job, Application.job_id == Job.id)
            .filter(
                Job.recruiter_id == current_user.id,
                Application.status == application_status,
            )
            .scalar()
            or 0
        )

    return {
        "total_jobs": total_jobs,
        "published_jobs": published_jobs,
        "total_applications": total_applications,
        "submitted": count_applications_by_status("submitted"),
        "shortlisted": count_applications_by_status("shortlisted"),
        "rejected": count_applications_by_status("rejected"),
        "hired": count_applications_by_status("hired"),
    }