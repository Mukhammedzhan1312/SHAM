from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint

# --- 1. Пользователь (Преподаватель) ---
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: Optional[str] = None

    # Связи
    reports: List["Report"] = Relationship(back_populates="owner")
    students: List["Student"] = Relationship(back_populates="owner")

# --- 2. Отчет (Загруженный файл) ---
class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str  # Название (например: "Осень 2025")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    owner_id: int = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="reports")
    
    grades: List["Grade"] = Relationship(back_populates="report")

# --- 3. Студент ---
class Student(SQLModel, table=True):
    # Уникальность студента только в рамках одного преподавателя
    __table_args__ = (
        UniqueConstraint("iin", "owner_id", name="unique_student_per_owner"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    iin: str = Field(index=True)
    last_name: str
    first_name: str
    middle_name: Optional[str] = None
    specialty_code: str
    course: int
    payment_form: str
    language: str
    
    # Привязка к преподавателю
    owner_id: int = Field(foreign_key="users.id")
    owner: User = Relationship(back_populates="students")

# --- 4. Дисциплина ---
class Discipline(SQLModel, table=True):
    # Дисциплины тоже могут быть уникальны для каждого преподавателя (или общие)
    # Здесь сделаем изоляцию для безопасности
    __table_args__ = (
        UniqueConstraint("code", "owner_id", name="unique_discipline_per_owner"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True)
    name: str
    
    owner_id: int = Field(foreign_key="users.id")

# --- 5. Оценка ---
class Grade(SQLModel, table=True):
    # Уникальность оценки теперь зависит от Отчета, Студента и Дисциплины
    __table_args__ = (
        UniqueConstraint("student_iin", "discipline_code", "report_id", name="unique_grade_per_report"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Ссылки (храним как строки/ID для связи)
    student_iin: str 
    discipline_code: str 
    
    # Привязка к конкретному ОТЧЕТУ
    report_id: int = Field(foreign_key="report.id")
    report: Report = Relationship(back_populates="grades")

    attestation_1: float
    attestation_2: float
    exam: float
    total_score: float
    letter_grade: str
    gpa: float





class ChatTopic(SQLModel, table=True):
    __tablename__ = "chat_topics"

    # Используем string для ID, так как в Mongo это ObjectId (24 символа)
    id: Optional[str] = Field(default=None, primary_key=True)
    
    title_ru: Optional[str] = None
    title_kz: Optional[str] = None
    title_en: Optional[str] = None
    
    # "order" — зарезервированное слово в SQL, но в коде пишем так
    order: int = Field(default=0)
    
    active: bool = Field(default=True)
    has_subtopics: bool = Field(default=False)
    action: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        # Это позволит корректно работать с данными, если они приходят как словари
        from_attributes = True


from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import Column, LargeBinary  # Нужен для хранения PDF

class GuideSection(SQLModel, table=True):
    __tablename__ = "guide_sections"

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True) # например, 'rules', 'contacts'
    order: int = Field(default=0)
    icon: Optional[str] = None
    
    title_ru: str
    title_kz: Optional[str] = None
    title_en: Optional[str] = None
    
    content_ru: Optional[str] = None
    content_kz: Optional[str] = None
    content_en: Optional[str] = None
    
    pdf_filename: Optional[str] = None
    # Поле для хранения самого файла в базе данных (Postgres BYTEA)
    pdf_data: Optional[bytes] = Field(default=None, sa_column=Column(LargeBinary))
    
    active: bool = Field(default=True)