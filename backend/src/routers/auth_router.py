from fastapi import APIRouter, Depends, HTTPException, status

from src.middleware import get_current_user
from src.routers.auth_schemas import SignUpRequest, SignInRequest, AuthResponse
from src.supabase_client import get_supabase_public

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignUpRequest):
    supabase = get_supabase_public()
    try:
        result = supabase.auth.sign_up(
            {"email": req.email, "password": req.password},
        )
        user = result.user
        if user and req.full_name:
            supabase.auth.admin.update_user_by_id(
                user.id,
                {"user_metadata": {"full_name": req.full_name}},
            )
        return AuthResponse(
            access_token=result.session.access_token if result.session else None,
            user=user.model_dump() if user else None,
            message="Akun berhasil dibuat. Cek email untuk konfirmasi.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/signin", response_model=AuthResponse)
async def signin(req: SignInRequest):
    supabase = get_supabase_public()
    try:
        result = supabase.auth.sign_in_with_password(
            {"email": req.email, "password": req.password},
        )
        return AuthResponse(
            access_token=result.session.access_token,
            user=result.user.model_dump(),
            message="Login berhasil.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah.",
        )


@router.post("/signout")
async def signout():
    supabase = get_supabase_public()
    supabase.auth.sign_out()
    return {"message": "Logout berhasil."}


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}
