
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.candidate_profile import CandidateProfile
from app.models.user import User
from app.schemas.candidate_profile import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
)

router = APIRouter(
    prefix="/candidate-profile",
    tags=["Candidate Profile"],
)

RESUME_DIR = Path(__file__).resolve().parents[2] / "uploads" / "resumes"
MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB


def require_candidate(current_user: User):
    if current_user.role != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can access this profile.",
        )


def get_or_create_profile(db: Session, user_id: int):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == user_id)
        .first()
    )

    if profile is None:
        profile = CandidateProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


def resume_path_for(user_id: int) -> Path:
    # Never use a client-provided filename for filesystem access.
    return RESUME_DIR / f"candidate_{user_id}.pdf"


def profile_response(profile: CandidateProfile, user_id: int):
    profile.resume_url = (
        "/candidate-profile/me/resume"
        if resume_path_for(user_id).is_file()
        else None
    )
    return profile


@router.get("/me", response_model=CandidateProfileResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)
    profile = get_or_create_profile(db, current_user.id)
    return profile_response(profile, current_user.id)


@router.put("/me", response_model=CandidateProfileResponse)
def update_my_profile(
    profile_data: CandidateProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    profile = get_or_create_profile(db, current_user.id)

    for field, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile_response(profile, current_user.id)


@router.post("/me/resume", response_model=CandidateProfileResponse)
async def upload_my_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are allowed.",
        )

    # Read at most 5 MB plus one byte to enforce the size limit.
    content = await file.read(MAX_RESUME_SIZE + 1)
    await file.close()

    if len(content) > MAX_RESUME_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Resume must be 5 MB or smaller.",
        )

    # Check the PDF file signature, not just its extension or MIME type.
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid PDF.",
        )

    RESUME_DIR.mkdir(parents=True, exist_ok=True)
    destination = resume_path_for(current_user.id)
    temporary = destination.with_suffix(".tmp")

    try:
        temporary.write_bytes(content)
        temporary.replace(destination)
    except OSError:
        temporary.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Could not save the resume. Please try again.",
        )

    profile = get_or_create_profile(db, current_user.id)
    db.commit()
    db.refresh(profile)

    return profile_response(profile, current_user.id)


@router.get("/me/resume")
def download_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    path = resume_path_for(current_user.id)

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="No resume has been uploaded.",
        )

    return FileResponse(
        path=path,
        media_type="application/pdf",
        filename="resume.pdf",
        content_disposition_type="attachment",
    )


@router.delete("/me/resume", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_resume(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_candidate(current_user)

    path = resume_path_for(current_user.id)

    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="No resume has been uploaded.",
        )

    path.unlink()

    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .first()
    )

    if profile is not None:
        db.commit()

    return None
