
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ApplicationCreate(BaseModel):
    resume_url: str | None = None
    cover_letter: str | None = None


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    resume_url: str | None
    cover_letter: str | None
    status: str
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationJobInfo(BaseModel):
    id: int
    title: str
    company: str
    location: str | None = None
    employment_type: str | None = None

    model_config = ConfigDict(from_attributes=True)


class MyApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    resume_url: str | None
    cover_letter: str | None
    status: str
    applied_at: datetime
    job: ApplicationJobInfo

    model_config = ConfigDict(from_attributes=True)
