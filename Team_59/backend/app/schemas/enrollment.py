from pydantic import BaseModel


class EnrollmentRead(BaseModel):
    id: int
    user_id: int
    course_id: int
    progress: float
    completed: int

    class Config:
        from_attributes = True
