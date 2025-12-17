from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models.lesson import Lesson
from ..models.course import Course
from ..models.user import User
from ..schemas.lesson import LessonCreate, LessonRead
from .auth import get_current_user

router = APIRouter()


def _ensure_instructor_or_admin(user: User) -> None:
    if user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors or admins can perform this action",
        )


@router.get(
    "/courses/{course_id}/lessons",
    response_model=List[LessonRead],
)
def list_lessons(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    _ensure_instructor_or_admin(current_user)
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not the instructor for this course",
        )

    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.order.asc())
        .all()
    )
    return lessons


@router.post(
    "/courses/{course_id}/lessons",
    response_model=LessonRead,
    status_code=status.HTTP_201_CREATED,
)
def create_lesson(
    course_id: int,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    _ensure_instructor_or_admin(current_user)
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not the instructor for this course",
        )

    lesson = Lesson(
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        duration_minutes=payload.duration_minutes,
        content=payload.content,
        video_url=payload.video_url,
        ar_model_id=payload.ar_model_id,
        order=payload.order,
        is_published=payload.is_published,
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson
