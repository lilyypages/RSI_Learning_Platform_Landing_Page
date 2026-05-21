from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.middleware import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/mastery")
def get_mastery_analytics(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get mastery level analytics for the current student."""
    return {"message": "Mastery analytics", "user_email": user.get("email")}


@router.get("/adaptation")
def get_adaptation_score(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get adaptation score insights."""
    return {"message": "Adaptation score", "user_email": user.get("email")}
