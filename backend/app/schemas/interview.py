
from datetime import datetime, timezone
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


InterviewType = Literal["online", "in_person"]

InterviewStatus = Literal[
    "scheduled",
    "rescheduled",
    "cancelled",
    "completed",
]


class InterviewCreate(BaseModel):
    scheduled_at: datetime
    duration_minutes: int = Field(default=30, ge=15, le=240)
    interview_type: InterviewType = "online"
    meeting_link: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=5000)

    @model_validator(mode="after")
    def validate_interview_details(self):
        # Normalize the scheduled time to UTC for comparison.
        scheduled_at = self.scheduled_at

        if scheduled_at.tzinfo is None:
            # Assume timezone-naive input represents UTC.
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)
        else:
            scheduled_at = scheduled_at.astimezone(timezone.utc)

        if scheduled_at <= datetime.now(timezone.utc):
            raise ValueError(
                "Interview must be scheduled in the future."
            )

        if self.interview_type == "online":
            if not self.meeting_link or not self.meeting_link.strip():
                raise ValueError(
                    "A meeting link is required for online interviews."
                )

        if self.interview_type == "in_person":
            if not self.location or not self.location.strip():
                raise ValueError(
                    "A location is required for in-person interviews."
                )

        return self


class InterviewUpdate(BaseModel):
    scheduled_at: datetime | None = None
    duration_minutes: int | None = Field(
        default=None,
        ge=15,
        le=240,
    )
    interview_type: InterviewType | None = None
    meeting_link: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=255)
    notes: str | None = Field(default=None, max_length=5000)
    status: InterviewStatus | None = None


class InterviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    scheduled_by: int
    scheduled_at: datetime
    duration_minutes: int
    interview_type: str
    meeting_link: str | None
    location: str | None
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime
