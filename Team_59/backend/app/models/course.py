from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..db import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    short_description = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    thumbnail = Column(String, nullable=True)
    duration_minutes = Column(Integer, default=0)
    level = Column(String, default="beginner")
    category = Column(String, default="general")

    enrollment_count = Column(Integer, default=0)
    rating = Column(Float, default=0.0)
    total_ratings = Column(Integer, default=0)

    has_ar = Column(Boolean, default=False)
    price = Column(Float, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    instructor = relationship("User", backref="courses")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
