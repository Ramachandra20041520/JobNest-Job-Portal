
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.application import Application
from app.models.interview import Interview
from app.models.job import Job
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewUpdate,
)

router = APIRouter(prefix="/interviews", tags=["Interviews"])


def require_role(current_user: User, role: str):
    if current_user.role != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only {role}s can access this endpoint.",
        )


def get_recruiter_interview(
    interview_id: int,
    recruiter_id: int,
    db: Session,
) -> Interview:
    interview = (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Interview.id == interview_id,
            Job.recruiter_id == recruiter_id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found.",
        )

    return interview


def validate_details(
    interview_type: str,
    meeting_link: str | None,
    location: str | None,
):
    if interview_type == "online" and not meeting_link:
        raise HTTPException(
            status_code=422,
            detail="A meeting link is required for online interviews.",
        )

    if interview_type == "in_person" and not location:
        raise HTTPException(
            status_code=422,
            detail="A location is required for in-person interviews.",
        )


def validate_future(scheduled_at: datetime):
    # MySQL DATETIME is stored as a naive datetime here; treat it as UTC.
    if scheduled_at.tzinfo is None:
        scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

    if scheduled_at <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=422,
            detail="Interview must be scheduled in the future.",
        )

    return scheduled_at.astimezone(timezone.utc).replace(tzinfo=None)


@router.post(
    "/applications/{application_id}",
    response_model=InterviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def schedule_interview(
    application_id: int,
    payload: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, "recruiter")

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if application is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found for one of your jobs.",
        )

    existing = (
        db.query(Interview)
        .filter(Interview.application_id == application_id)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An interview already exists for this application. Update it instead.",
        )

    scheduled_at = validate_future(payload.scheduled_at)

    validate_details(
        payload.interview_type,
        payload.meeting_link,
        payload.location,
    )

    interview = Interview(
        application_id=application.id,
        scheduled_by=current_user.id,
        scheduled_at=scheduled_at,
        duration_minutes=payload.duration_minutes,
        interview_type=payload.interview_type,
        meeting_link=payload.meeting_link,
        location=payload.location,
        notes=payload.notes,
        status="scheduled",
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return interview


@router.get(
    "/recruiter",
    response_model=list[InterviewResponse],
)
def list_recruiter_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, "recruiter")

    return (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.id)
        .join(Job, Application.job_id == Job.id)
        .filter(Job.recruiter_id == current_user.id)
        .order_by(Interview.scheduled_at.asc())
        .all()
    )


@router.get(
    "/candidate",
    response_model=list[InterviewResponse],
)
def list_candidate_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, "candidate")

    return (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.id)
        .filter(Application.candidate_id == current_user.id)
        .order_by(Interview.scheduled_at.asc())
        .all()
    )


@router.patch(
    "/{interview_id}",
    response_model=InterviewResponse,
)
def update_interview(
    interview_id: int,
    payload: InterviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_role(current_user, "recruiter")

    interview = get_recruiter_interview(
        interview_id,
        current_user.id,
        db,
    )

    if interview.status in ("cancelled", "completed"):
        raise HTTPException(
            status_code=409,
            detail="Cancelled or completed interviews cannot be changed.",
        )

    changes = payload.model_dump(exclude_unset=True)

    new_status = changes.get("status", interview.status)
    new_type = changes.get("interview_type", interview.interview_type)
    new_link = changes.get("meeting_link", interview.meeting_link)
    new_location = changes.get("location", interview.location)

    validate_details(new_type, new_link, new_location)

    if "scheduled_at" in changes and changes["scheduled_at"] is not None:
        changes["scheduled_at"] = validate_future(changes["scheduled_at"])

        if new_status == "scheduled":
            new_status = "rescheduled"

    changes["status"] = new_status

    for field, value in changes.items():
        setattr(interview, field, value)

    db.commit()
    db.refresh(interview)

    return interview
