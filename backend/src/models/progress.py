from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    class_subject_id = Column(UUID(as_uuid=True), nullable=False)
    completion_percent = Column(Float, default=0.0)
    total_score = Column(Integer, default=0)
    adaptive_level = Column(String(20), default="STANDARD")
    last_activity = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_id", "class_subject_id"),
    )


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    class_subject_id = Column(UUID(as_uuid=True), nullable=False)
    material_id = Column(UUID(as_uuid=True), nullable=False)
    score = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    lives_used = Column(Integer, default=0)
    streak_count = Column(Integer, default=0)
    result_level = Column(String(20))
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True))


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), nullable=False)
    answer_given = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_sec = Column(Integer)


class VideoWatch(Base):
    __tablename__ = "video_watches"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    student_id = Column(UUID(as_uuid=True), nullable=False)
    video_id = Column(UUID(as_uuid=True), nullable=False)
    watched_seconds = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    watched_at = Column(DateTime(timezone=True), server_default=func.now())


class PointLog(Base):
    __tablename__ = "point_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    points_earned = Column(Integer, nullable=False)
    source_type = Column(String(20), nullable=False)
    source_id = Column(UUID(as_uuid=True))
    description = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    class_subject_id = Column(UUID(as_uuid=True), nullable=False)
    teacher_id = Column(UUID(as_uuid=True))
    week_start = Column(Date, nullable=False)
    avg_score = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    recommendation = Column(Text)
    kkm_achieved = Column(Boolean, default=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
