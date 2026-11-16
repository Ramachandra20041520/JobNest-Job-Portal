
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.application import Application
from app.models.candidate_profile import CandidateProfile
from app.models.job import Job
from app.models.user import User
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    MyApplicationResponse,
)

router = APIRouter(prefix="/applications", tags=["Applications"])

# Same directory used by candidate_profile.py
RESUME_DIR = Path(__file__).resolve().parents[2] / "uploads" / "resumes"


def candidate_resume_path(candidate_id: int) -> Path:
    return RESUME_DIR / f"candidate_{candidate_id}.pdf"


def candidate_profile_data(db: Session, candidate_id: int):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == candidate_id)
        .first()
    )

    if not profile:
        return {
            "phone": None,
            "candidate_location": None,
            "education": None,
            "skills": None,
            "bio": None,
            "has_resume": candidate_resume_path(candidate_id).is_file(),
        }

    return {
        "phone": profile.phone,
        "candidate_location": profile.location,
        "education": profile.education,
        "skills": profile.skills,
        "bio": profile.bio,
        "has_resume": candidate_resume_path(candidate_id).is_file(),
    }


# 1. Candidate applies for a published job
@router.post(
    "/jobs/{job_id}",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_for_job(
    job_id: int,
    application_data: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can apply for jobs",
        )

    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.status == "published")
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Published job not found")

    existing = (
        db.query(Application)
        .filter(
            Application.candidate_id == current_user.id,
            Application.job_id == job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this job",
        )

    application = Application(
        candidate_id=current_user.id,
        job_id=job_id,
        resume_url=application_data.resume_url,
        cover_letter=application_data.cover_letter,
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


# 2. Candidate views their own applications
@router.get("/mine", response_model=list[MyApplicationResponse])
def get_my_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=403,
            detail="Only candidates can view their applications",
        )

    return (
        db.query(Application)
        .filter(Application.candidate_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )


# 3. Recruiter views applicants for their own jobs
@router.get("/recruiter")
def get_recruiter_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view applicants",
        )

    results = (
        db.query(Application, Job, User)
        .join(Job, Application.job_id == Job.id)
        .join(User, Application.candidate_id == User.id)
        .filter(Job.recruiter_id == current_user.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    applicants = []
    for application, job, candidate in results:
        applicants.append({
            "id": application.id,
            "job_id": job.id,
            "job_title": job.title,
            "company": job.company,
            "candidate_id": candidate.id,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "cover_letter": application.cover_letter,
            "resume_url": application.resume_url,
            "status": application.status,
            "applied_at": application.applied_at,
            **candidate_profile_data(db, candidate.id),
        })

    return applicants


# 4. Recruiter updates an application's status
@router.patch("/{application_id}/status")
def update_application_status(
    application_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can update application status",
        )

    allowed_statuses = {"submitted", "shortlisted", "rejected", "hired"}
    new_status = new_status.strip().lower()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Choose submitted, shortlisted, "
                "rejected, or hired."
            ),
        )

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found for your jobs",
        )

    application.status = new_status
    db.commit()
    db.refresh(application)

    return {
        "message": "Application status updated successfully",
        "application_id": application.id,
        "status": application.status,
    }


# 5. Recruiter views an applicant's details for their own job
@router.get("/recruiter/{application_id}")
def get_recruiter_application_details(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can view applicant details",
        )

    result = (
        db.query(Application, Job, User)
        .join(Job, Application.job_id == Job.id)
        .join(User, Application.candidate_id == User.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Application not found for your jobs",
        )

    application, job, candidate = result

    return {
        "id": application.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.name,
        "candidate_email": candidate.email,
        "job_id": job.id,
        "job_title": job.title,
        "company": job.company,
        "location": getattr(job, "location", None),
        "applied_at": application.applied_at,
        "cover_letter": application.cover_letter,
        "resume_url": application.resume_url,
        "status": application.status,
        **candidate_profile_data(db, candidate.id),
    }


# 6. Recruiter downloads the resume for an applicant to their own job
@router.get("/recruiter/{application_id}/resume")
def download_applicant_resume(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "recruiter":
        raise HTTPException(
            status_code=403,
            detail="Only recruiters can download applicant resumes",
        )

    application = (
        db.query(Application)
        .join(Job, Application.job_id == Job.id)
        .filter(
            Application.id == application_id,
            Job.recruiter_id == current_user.id,
        )
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found for your jobs",
        )

    path = candidate_resume_path(application.candidate_id)

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="This candidate has not uploaded a resume.",
        )

    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename="candidate_resume.pdf",
        content_disposition_type="attachment",
    )
