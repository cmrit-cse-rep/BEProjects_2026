from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr = Field(..., description="User email (used for login)")
    full_name: str | None = Field(
        default=None,
        description="Full name of the user",
    )
    role: str = Field(
        default="student",
        description="User role: student, instructor, or admin",
    )
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Plaintext password (will be hashed on the server)",
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2: ORM mode
