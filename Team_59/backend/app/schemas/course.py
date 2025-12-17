from pydantic import BaseModel, Field
from typing import Optional


class CourseBase(BaseModel):
    title: str = Field(..., max_length=255)
    short_description: str = Field(..., max_length=255)
    description: str
    thumbnail: Optional[str] = None
    duration_minutes: int = 0
    level: str = "beginner"
    category: str = "general"
    has_ar: bool = False
    price: float = 0.0


class CourseCreate(CourseBase):
    pass  # instructor_id comes from current user


class CourseRead(CourseBase):
    id: int
    instructor_id: int
    enrollment_count: int
    rating: float
    total_ratings: int

    class Config:
        from_attributes = True


class CourseWithEnrollment(CourseRead):
    is_enrolled: bool = False
    progress: float = 0.0
