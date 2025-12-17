from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("user_id", "course_id", name="uq_user_course"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    progress = Column(Float, default=0.0)  # 0–100
    completed = Column(Integer, default=0)  # can be bool if you prefer
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
