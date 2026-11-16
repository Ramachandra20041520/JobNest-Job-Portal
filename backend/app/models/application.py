
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    __table_args__ = (
        UniqueConstraint(
            "candidate_id",
            "job_id",
            name="unique_candidate_job_application",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
        index=True,
    )

    resume_url = Column(String(500), nullable=True)
    cover_letter = Column(Text, nullable=True)

    status = Column(
        String(30),
        nullable=False,
        default="submitted",
    )

    applied_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    job = relationship("Job")
