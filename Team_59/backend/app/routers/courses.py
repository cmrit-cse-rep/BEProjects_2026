from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.models.user import User
from app.schemas.course import CourseCreate, CourseRead, CourseWithEnrollment
from app.schemas.enrollment import EnrollmentRead
from app.routers.auth import get_current_user

router = APIRouter()


def _ensure_instructor_or_admin(user: User) -> None:
    if user.role not in ("instructor", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only instructors or admins can perform this action",
        )


@router.get("/courses", response_model=List[CourseWithEnrollment])
def list_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    courses = db.query(Course).all()

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .all()
    )
    enrollment_by_course = {e.course_id: e for e in enrollments}

    result: List[CourseWithEnrollment] = []
    for course in courses:
        enrolled = course.id in enrollment_by_course
        progress = (
            float(enrollment_by_course[course.id].progress)
            if enrolled
            else 0.0
        )
        result.append(
            CourseWithEnrollment(
                **CourseRead.model_validate(course).model_dump(),
                is_enrolled=enrolled,
                progress=progress,
            )
        )
    return result


@router.get("/courses/{course_id}", response_model=CourseWithEnrollment)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )

    base = CourseRead.model_validate(course)
    return CourseWithEnrollment(
        **base.model_dump(),
        is_enrolled=enrollment is not None,
        progress=float(enrollment.progress) if enrollment else 0.0,
    )


@router.post(
    "/courses",
    response_model=CourseRead,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_instructor_or_admin(current_user)

    course = Course(
        title=payload.title,
        short_description=payload.short_description,
        description=payload.description,
        thumbnail=payload.thumbnail,
        duration_minutes=payload.duration_minutes,
        level=payload.level,
        category=payload.category,
        has_ar=payload.has_ar,
        price=payload.price,
        instructor_id=current_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.post(
    "/courses/{course_id}/enroll",
    response_model=EnrollmentRead,
    status_code=status.HTTP_201_CREATED,
)
def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == current_user.id,
            Enrollment.course_id == course_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course",
        )

    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        progress=0.0,
        completed=0,
    )
    db.add(enrollment)

    course.enrollment_count += 1
    db.add(course)

    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/me/courses", response_model=List[CourseWithEnrollment])
def my_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == current_user.id)
        .all()
    )
    course_ids = [e.course_id for e in enrollments]

    courses = (
        db.query(Course)
        .filter(Course.id.in_(course_ids))
        .all()
    )

    enrollment_by_course = {e.course_id: e for e in enrollments}
    result: List[CourseWithEnrollment] = []
    for course in courses:
        e = enrollment_by_course.get(course.id)
        base = CourseRead.model_validate(course)
        result.append(
            CourseWithEnrollment(
                **base.model_dump(),
                is_enrolled=True,
                progress=float(e.progress) if e else 0.0,
            )
        )
    return result


# ---------- NEW INSTRUCTOR ENDPOINTS ----------


@router.get("/instructor/courses", response_model=List[CourseRead])
def instructor_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_instructor_or_admin(current_user)

    courses = (
        db.query(Course)
        .filter(Course.instructor_id == current_user.id)
        .all()
    )
    return [CourseRead.model_validate(c) for c in courses]


@router.get(
    "/instructor/courses/{course_id}/students",
    response_model=List[EnrollmentRead],
)
def instructor_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_instructor_or_admin(current_user)

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="You are not the instructor for this course",
        )

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id)
        .all()
    )
    return enrollments
