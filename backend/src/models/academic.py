from sqlalchemy import Column, String, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from src.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    icon_url = Column(String(255))


class Class(Base):
    __tablename__ = "classes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(50), nullable=False)
    grade_level = Column(Integer, nullable=False)
    homeroom_teacher_id = Column(UUID(as_uuid=True))
    academic_year = Column(Integer, nullable=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    class_id = Column(UUID(as_uuid=True))
    parent_id = Column(UUID(as_uuid=True))
    nis = Column(String(50), unique=True, nullable=False, index=True)
    birthdate = Column(Date)
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    lives_remaining = Column(Integer, default=3)


class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    class_id = Column(UUID(as_uuid=True), nullable=False)
    subject_id = Column(UUID(as_uuid=True), nullable=False)
    teacher_id = Column(UUID(as_uuid=True))
    semester = Column(Integer, nullable=False)
    academic_year = Column(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("class_id", "subject_id", "semester", "academic_year"),
    )
