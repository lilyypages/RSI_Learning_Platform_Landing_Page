from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.middleware import get_current_user

router = APIRouter(prefix="/progress", tags=["Student Progress"])


@router.get("/dashboard")
def get_progress_dashboard(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get aggregated progress for the current student."""
    return {"message": "Dashboard progress", "user_email": user.get("email")}


@router.get("/by-course/{course_id}")
def get_progress_by_course(
    course_id: int,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get student progress grouped by course."""
    return {"course_id": course_id, "user_email": user.get("email")}
