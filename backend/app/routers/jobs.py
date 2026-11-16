
from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobResponse, JobUpdate


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def require_recruiter(current_user: User):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can manage job postings.",
        )


def get_owned_job(
    job_id: int,
    recruiter_id: int,
    db: Session,
) -> Job:
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.recruiter_id == recruiter_id,
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found.",
        )

    return job


# Create a job (recruiters only)
@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_recruiter(current_user)

    job = Job(
        **payload.model_dump(),
        recruiter_id=current_user.id,
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return job


# List jobs belonging to the logged-in recruiter
@router.get("/mine", response_model=list[JobResponse])
def list_my_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_recruiter(current_user)

    jobs = (
        db.query(Job)
        .filter(Job.recruiter_id == current_user.id)
        .order_by(Job.created_at.desc())
        .all()
    )

    return jobs


# List published jobs and optionally search by title or company
@router.get("", response_model=list[JobResponse])
def list_published_jobs(
    search: str | None = Query(default=None, max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(Job).filter(Job.status == "published")

    if search and search.strip():
        keyword = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Job.title.ilike(keyword),
                Job.company.ilike(keyword),
            )
        )

    return query.order_by(Job.created_at.desc()).all()


# Get one published job (public endpoint)
@router.get("/{job_id}/public", response_model=JobResponse)
def get_public_job(
    job_id: int,
    db: Session = Depends(get_db),
):
    job = (
        db.query(Job)
        .filter(
            Job.id == job_id,
            Job.status == "published",
        )
        .first()
    )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published job not found.",
        )

    return job


# Get one job owned by the logged-in recruiter
@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_recruiter(current_user)

    return get_owned_job(job_id, current_user.id, db)


# Update a job owned by the logged-in recruiter
@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    payload: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_recruiter(current_user)

    job = get_owned_job(job_id, current_user.id, db)
    changes = payload.model_dump(exclude_unset=True)

    # Validate the combined salary range.
    minimum = changes.get("salary_min", job.salary_min)
    maximum = changes.get("salary_max", job.salary_max)

    if minimum is not None and maximum is not None and minimum > maximum:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum salary cannot exceed maximum salary.",
        )

    for field, value in changes.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return job


# Delete a job only when no applications are linked to it
@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_recruiter(current_user)

    # Verify that this job belongs to the logged-in recruiter.
    job = get_owned_job(job_id, current_user.id, db)

    # Count applications linked to this job.
    application_count = (
        db.query(func.count(Application.id))
        .filter(Application.job_id == job_id)
        .scalar()
        or 0
    )

    # Preserve candidate applications and hiring history.
    if application_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"This job cannot be deleted because {application_count} "
                "application(s) are linked to it. Close the job instead "
                "to preserve application history."
            ),
        )

    db.delete(job)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
