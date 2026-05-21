from sqlalchemy import Column, String, Integer, Text, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from src.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    class_subject_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content_text = Column(Text)
    order_index = Column(Integer, nullable=False)
    difficulty = Column(String(20), default="MEDIUM")
    is_published = Column(Boolean, default=False)


class Video(Base):
    __tablename__ = "videos"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    material_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    embed_url = Column(String(255), nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    point_reward = Column(Integer, default=0)


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    material_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    options = Column(JSONB, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    difficulty = Column(String(20), default="MEDIUM")
    point_reward = Column(Integer, default=0)
    order_index = Column(Integer, nullable=False)
