
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from app.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)

    application_id = Column(
        Integer,
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    scheduled_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    scheduled_at = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=30)

    interview_type = Column(
        String(30),
        nullable=False,
        default="online",
    )

    meeting_link = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    status = Column(
        String(30),
        nullable=False,
        default="scheduled",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
