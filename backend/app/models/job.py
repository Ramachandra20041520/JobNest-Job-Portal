
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    recruiter_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    location = Column(String(150), nullable=False)

    employment_type = Column(
        String(30),
        nullable=False,
        default="Full-time",
    )

    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)

    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)

    status = Column(
        String(20),
        nullable=False,
        default="draft",
        server_default="draft",
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
