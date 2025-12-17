from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..db import Base


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)

    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String, default="video")  # video | ar | quiz | reading | interactive
    duration_minutes = Column(Integer, default=0)
    content = Column(Text, default="")      # e.g., markdown/body
    video_url = Column(String, nullable=True)
    ar_model_id = Column(String, nullable=True)

    order = Column(Integer, default=1)
    is_published = Column(Boolean, default=True)

    course = relationship("Course", backref="lessons")
