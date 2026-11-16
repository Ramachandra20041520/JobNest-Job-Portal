
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


EmploymentType = Literal[
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
    "Remote",
]

JobStatus = Literal["draft", "published", "closed"]


class JobBase(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    company: str = Field(min_length=2, max_length=150)
    location: str = Field(min_length=2, max_length=150)

    employment_type: EmploymentType = "Full-time"

    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    description: str = Field(min_length=20)
    requirements: str = Field(min_length=5)

    @model_validator(mode="after")
    def validate_salary_range(self):
        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_min > self.salary_max
        ):
            raise ValueError(
                "Minimum salary cannot exceed maximum salary."
            )
        return self


class JobCreate(JobBase):
    status: JobStatus = "draft"


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=150)
    company: str | None = Field(default=None, min_length=2, max_length=150)
    location: str | None = Field(default=None, min_length=2, max_length=150)

    employment_type: EmploymentType | None = None
    salary_min: int | None = Field(default=None, ge=0)
    salary_max: int | None = Field(default=None, ge=0)

    description: str | None = Field(default=None, min_length=20)
    requirements: str | None = Field(default=None, min_length=5)
    status: JobStatus | None = None

    @model_validator(mode="after")
    def validate_salary_range(self):
        minimum = self.salary_min
        maximum = self.salary_max

        if minimum is not None and maximum is not None and minimum > maximum:
            raise ValueError(
                "Minimum salary cannot exceed maximum salary."
            )
        return self


class JobResponse(JobBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recruiter_id: int
    status: JobStatus
    created_at: datetime
    updated_at: datetime
