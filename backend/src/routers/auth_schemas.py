from pydantic import BaseModel, EmailStr


class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str | None = None
    user: dict | None = None
    message: str
