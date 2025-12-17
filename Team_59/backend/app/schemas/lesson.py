from pydantic import BaseModel, Field
from typing import Optional


class LessonBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    type: str = Field(default="video")
    duration_minutes: int = 0
    content: str = ""
    video_url: Optional[str] = None
    ar_model_id: Optional[str] = None
    order: int = 1
    is_published: bool = True


class LessonCreate(LessonBase):
    pass  # course_id comes from path


class LessonRead(LessonBase):
    id: int
    course_id: int

    class Config:
        from_attributes = True
