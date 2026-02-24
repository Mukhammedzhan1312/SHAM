from fastapi import  Depends, FastAPI, HTTPException, Form, Query

from sqlmodel import Session, select, func, and_, or_, col
from sqlalchemy import Numeric
from typing import List, Optional
import datetime

# Импорт твоих настроек и моделей
from database import get_session
from models.domain import User, Report, Student, Grade, Discipline, ChatTopic
from models.auth import get_current_user

app = FastAPI(title="StudentPerf API")

# --- 1. ТЕМЫ ЧАТА ---
@app.get("/api/chat_topics")
async def get_chat_topics(session: Session = Depends(get_session)):
    statement = (
        select(ChatTopic)
        .order_by(ChatTopic.order.asc())
        .limit(50)
    )
    results = session.exec(statement).all()
    return results

# --- 2. СТУДЕНТЫ ГРУППЫ РИСКА ---
@app.get("/analysis/at_risk")
async def get_at_risk_students(
    threshold: str = "all",
    limit: int = 10,
    report_id: int = 1,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Проверка владельца отчета
    report = session.get(Report, report_id)
    if not report or report.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    avg_gpa = func.avg(Grade.gpa)
    low_scores_count = func.count(Grade.id).filter(Grade.total_score < 50)

    # Условия HAVING
    if threshold == "critical":
        having_cond = avg_gpa < 1.0
    elif threshold == "low":
        having_cond = avg_gpa < 1.5
    elif threshold == "multiple_low":
        having_cond = low_scores_count >= 2
    else:
        having_cond = or_(avg_gpa < 1.5, low_scores_count >= 2)

    statement = (
        select(
            Student.iin,
            (Student.last_name + " " + Student.first_name).label("full_name"),
            Student.course,
            func.round(func.cast(avg_gpa, Numeric), 2).label("gpa"),
            low_scores_count.label("low_scores")
        )
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id)
        .where(Student.owner_id == current_user.id)
        .group_by(Student.iin, Student.last_name, Student.first_name, Student.course)
        .having(having_cond)
        .order_by(avg_gpa.asc())
        .limit(limit)
    )

    results = session.exec(statement).all()
    return {"found": bool(results), "students": [row._asdict() for row in results]}

# --- 3. ОБЩАЯ СТАТИСТИКА ---
@app.get("/stats/general")
async def get_general_stats(
    report_id: int = 1, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Агрегаты
    total_students = func.count(func.distinct(Student.iin))
    avg_score = func.round(func.cast(func.avg(Grade.gpa), Numeric), 2)
    risk_count = func.count(func.distinct(Student.iin)).filter(Grade.gpa < 1.7)

    statement = (
        select(total_students, avg_score, risk_count)
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id)
        .where(Student.owner_id == current_user.id)
    )
    
    res = session.exec(statement).first()
    return {
        "total_students": res[0] or 0,
        "avg_score": res[1] or 0,
        "students_at_risk": res[2] or 0
    }

# --- 4. АНАЛИЗ ПО КУРСАМ ---
@app.get("/analysis/by_course/{course}")
async def analysis_by_course(
    course: str, 
    report_id: int = 1,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Логика фильтра курса
    if course.isdigit():
        course_filter = (Student.course == int(course))
    elif course.lower() == "magistratura":
        course_filter = (Student.course >= 5)
    else:
        raise HTTPException(400, "Неверный курс")

    # Подзапрос для расчета среднего GPA каждого студента
    sub_stmt = (
        select(
            Student.iin,
            func.avg(Grade.gpa).label("st_avg")
        )
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id)
        .where(Student.owner_id == current_user.id)
        .where(course_filter)
        .group_by(Student.iin)
    ).subquery()

    # Финальный расчет по подзапросу
    final_stmt = select(
        func.count().label("total"),
        func.avg(sub_stmt.c.st_avg).label("avg_gpa"),
        func.count().filter(sub_stmt.c.st_avg >= 2.0).label("success"),
        func.count().filter(sub_stmt.c.st_avg < 1.7).label("risk")
    )
    
    res = session.exec(final_stmt).first()
    
    if not res or res.total == 0:
        return {"total_students": 0, "message": "Данные не найдены"}

    return {
        "course": course,
        "total_students": res.total,
        "avg_gpa": round(float(res.avg_gpa or 0), 2),
        "success_rate": round((res.success / res.total) * 100, 1),
        "at_risk": res.risk
    }

# --- 5. ПОИСК СТУДЕНТА ---
@app.get("/search")
async def search_student(
    query: str, 
    report_id: int = 1,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    search_pattern = f"%{query.lower()}%"
    
    statement = (
        select(Student)
        .where(Student.owner_id == current_user.id)
        .where(or_(
            func.lower(Student.iin).like(search_pattern),
            func.lower(Student.last_name).like(search_pattern),
            func.lower(Student.first_name).like(search_pattern)
        ))
        .limit(20)
    )
    
    students = session.exec(statement).all()
    return {"found": bool(students), "results": students}