
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CandidateProfileUpdate(BaseModel):
    phone: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default=None, max_length=150)
    education: Optional[str] = Field(default=None, max_length=200)
    skills: Optional[str] = None
    bio: Optional[str] = None


class CandidateProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    phone: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime
