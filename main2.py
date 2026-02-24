import io
from typing import List, Optional
from collections import OrderedDict

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, func, or_, and_, col
from sqlalchemy import Numeric

# Импорт моделей и зависимостей (убедись, что пути верны)
from database import get_session
from models.domain import Student, Grade, Discipline, ChatTopic, Report, GuideSection


app = FastAPI(title="StudentPerf API")

UserId = 1
# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В продакшене укажи конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. ТЕМЫ ЧАТА ---
@app.get("/api/chat_topics")
async def get_chat_topics(session: Session = Depends(get_session)):
    """Получение списка тем для чата"""
    statement = select(ChatTopic).order_by(ChatTopic.order.asc())
    return session.exec(statement).all()

# --- 2. АНАЛИЗ: ГРУППА РИСКА ---
@app.get("/analysis/at_risk")
async def get_at_risk_students(
    threshold: str = "all", 
    limit: int = 10,
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    """Студенты с низким GPA или долгами"""
    # Агрегаты
    avg_gpa = func.avg(Grade.gpa)
    low_scores_count = func.count(Grade.id).filter(Grade.total_score < 50)

    # Логика фильтрации (аналог MongoDB threshold)
    if threshold == "critical":
        having_cond = avg_gpa < 1.0
    elif threshold == "low":
        having_cond = avg_gpa < 1.5
    elif threshold == "multiple_low":
        having_cond = low_scores_count >= 2
    else: # all
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
        .where(Student.owner_id == UserId)
        .group_by(Student.iin, Student.last_name, Student.first_name, Student.course)
        .having(having_cond)
        .order_by(avg_gpa.asc())
        .limit(limit)
    )
    
    results = session.exec(statement).all()
    
    # Подсчет общего количества (Total) через подзапрос
    subquery = (
        select(Student.iin)
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id)
        .group_by(Student.iin)
        .having(having_cond)
    ).subquery()
    
    total_at_risk = session.exec(select(func.count()).select_from(subquery)).one()

    return {
        "found": bool(results),
        "total_at_risk": total_at_risk,
        "students": [row._asdict() for row in results]
    }

# --- 3. ПОИСК СТУДЕНТА (ДЕТАЛЬНЫЙ) ---
@app.post("/search_student")
async def search_student(
    search_data: dict, 
    report_id: int = Query(1),
    session: Session = Depends(get_session)
):
    """Поиск студента с полной группировкой предметов"""
    query_text = search_data.get("query", "").strip()
    if not query_text:
        raise HTTPException(400, "Запрос пуст")

    search_pattern = f"%{query_text.lower()}%"
    
    # Выбираем студентов и их оценки
    statement = (
        select(Student, Grade, Discipline.name.label("subject_name"))
        .join(Grade, Grade.student_iin == Student.iin, isouter=True)
        .join(Discipline, Discipline.code == Grade.discipline_code, isouter=True)
        .where(Student.owner_id == UserId)
        .where(and_(
            Grade.report_id == report_id,
            or_(
                Student.iin == query_text,
                func.lower(Student.last_name).like(search_pattern),
                func.lower(Student.first_name).like(search_pattern)
            )
        ))
    )
    
    rows = session.exec(statement).all()
    if not rows:
        return {"found": False, "message": "Никто не найден"}

    # Группировка в Python (как в твоем коде для Mongo)
    students_map = {}
    for student, grade, subject_name in rows:
        if student.iin not in students_map:
            students_map[student.iin] = {
                "iin": student.iin,
                "full_name": f"{student.last_name} {student.first_name} {student.middle_name or ''}".strip(),
                "specialty_code": student.specialty_code,
                "course": student.course,
                "payment_form": student.payment_form,
                "study_language": student.language,
                "all_subjects": []
            }
        
        if grade:
            students_map[student.iin]["all_subjects"].append({
                "subject_code": grade.discipline_code,
                "subject_name": subject_name or "—",
                "final_score": grade.total_score,
                "letter_grade": grade.letter_grade,
                "gpa": grade.gpa
            })

    # Считаем итоговый GPA для каждого найденного студента
    results = list(students_map.values())
    for res in results:
        scores = [s["gpa"] for s in res["all_subjects"] if s["gpa"] is not None]
        res["gpa"] = round(sum(scores) / len(scores), 2) if scores else 0
        res["subjects_count"] = len(res["all_subjects"])

    return {"found": True, "results": results}

# --- 4. СРАВНЕНИЕ КУРСОВ/ГРУПП ---
@app.get("/analysis/compare")
async def compare_analysis(
    type: str, # "course" или "specialty"
    value1: str, 
    value2: str,
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    """Сравнение двух потоков данных"""
    
    async def get_stats(val: str):
        # Динамический фильтр
        filt = Student.course == int(val) if type == "course" else Student.specialty_code == val
        
        stmt = (
            select(
                func.count(func.distinct(Student.iin)).label("total"),
                func.round(func.cast(func.avg(Grade.gpa), Numeric), 2).label("avg_gpa"),
                func.count(func.distinct(Student.iin)).filter(Grade.gpa >= 2.0).label("success"),
                func.count(func.distinct(Student.iin)).filter(Grade.gpa < 1.7).label("risk")
            )
            .join(Grade, Grade.student_iin == Student.iin)
            .where(filt, Grade.report_id == report_id, Student.owner_id == UserId)
        )
        res = session.exec(stmt).first()
        
        total = res.total or 0
        return {
            "total_students": total,
            "avg_gpa": float(res.avg_gpa or 0),
            "success_rate": round((res.success / total * 100), 1) if total > 0 else 0,
            "at_risk": res.risk or 0,
            "label": val
        }

    return {
        "found": True,
        "left": await get_stats(value1),
        "right": await get_stats(value2)
    }

# --- 5. ПУТЕВОДИТЕЛЬ (GUIDE) ---
@app.get("/api/guide_sections")
async def get_guide_sections(session: Session = Depends(get_session)):
    """Список разделов гида без тяжелых PDF данных"""
    # Выбираем только нужные поля (без бинарного pdf_data)
    statement = select(
        GuideSection.key, GuideSection.title_ru, GuideSection.icon, 
        GuideSection.order, GuideSection.pdf_filename
    ).where(GuideSection.active == True).order_by(GuideSection.order)
    
    results = session.exec(statement).all()
    return [row._asdict() for row in results]

@app.get("/api/guide/{key}/pdf/{action}")
async def serve_guide_pdf(key: str, action: str, session: Session = Depends(get_session)):
    """Просмотр или скачивание PDF"""
    statement = select(GuideSection).where(GuideSection.key == key)
    doc = session.exec(statement).first()
    
    if not doc or not doc.pdf_data:
        raise HTTPException(404, "Файл не найден")
    
    disposition = "inline" if action == "view" else "attachment"
    return StreamingResponse(
        io.BytesIO(doc.pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": f'{disposition}; filename="{doc.pdf_filename}"'}
    )

# --- 6. АНАЛИЗ ПО ДИСЦИПЛИНЕ ---
@app.get("/analysis/by_subject")
async def analysis_by_subject(
    subject: str, 
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    """Статистика по конкретному предмету"""
    search_pattern = f"%{subject.lower()}%"
    
    statement = (
        select(
            func.count(Grade.id).label("total_records"),
            func.avg(Grade.total_score).label("avg_score"),
            func.max(Grade.total_score).label("max_score"),
            func.count(Grade.id).filter(Grade.total_score >= 50).label("passed")
        )
        .join(Discipline, Discipline.code == Grade.discipline_code)
        .where(func.lower(Discipline.name).like(search_pattern), Grade.report_id == report_id)
    )
    
    res = session.exec(statement).first()
    if not res or res.total_records == 0:
        return {"found": False}

    total = res.total_records
    return {
        "found": True,
        "total_students": total,
        "avg_score": round(float(res.avg_score or 0), 2),
        "max_score": res.max_score,
        "success_rate": round((res.passed / total * 100), 1)
    }



@app.get("/analysis/by_subject")
async def analysis_by_subject(
    subject: str, 
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    subject_pattern = f"%{subject.strip().lower()}%"
    
    # Считаем статистику по оценкам для конкретного предмета
    statement = (
        select(
            func.count(Grade.student_iin).label("total_students"),
            func.round(func.cast(func.avg(Grade.total_score), Numeric), 2).label("avg_score"),
            func.max(Grade.total_score).label("max_score"),
            func.count(Grade.id).filter(Grade.total_score >= 50).label("passed")
        )
        .join(Discipline, Discipline.code == Grade.discipline_code)
        .where(func.lower(Discipline.name).like(subject_pattern))
        .where(Grade.report_id == report_id)
    )
    
    res = session.exec(statement).first()
    
    if not res or res.total_students == 0:
        return {"found": False, "message": "Дисциплина не найдена"}

    total = res.total_students
    passed = res.passed
    
    return {
        "found": True,
        "total_students": total,
        "avg_score": float(res.avg_score or 0),
        "max_score": res.max_score or 0,
        "passed": passed,
        "failed": total - passed,
        "success_rate": round((passed / total * 100), 1) if total > 0 else 0
    }






@app.get("/analysis/course_students/{course}")
async def get_course_students(
    course: str, 
    limit: int = 50, 
    report_id: int = 1,
    session: Session = Depends(get_session),
):
    # Определяем фильтр курса
    if course.isdigit():
        course_filter = (Student.course == int(course))
    else:
        course_filter = (Student.course >= 5) # Магистратура

    # Запрос: Студент + его средний GPA по конкретному отчету
    statement = (
        select(
            Student.iin,
            (Student.last_name + " " + Student.first_name).label("full_name"),
            Student.specialty_code,
            func.round(func.cast(func.avg(Grade.gpa), Numeric), 2).label("gpa")
        )
        .join(Grade, Grade.student_iin == Student.iin)
        .where(course_filter, Grade.report_id == report_id, Student.owner_id == UserId)
        .group_by(Student.iin, Student.last_name, Student.first_name, Student.specialty_code)
        .order_by(col("gpa").asc())
        .limit(limit)
    )

    results = session.exec(statement).all()
    
    # Считаем общее кол-во студентов на курсе для пагинации
    total_count = session.exec(select(func.count(Student.id)).where(course_filter)).one()

    students_list = []
    for row in results:
        data = row._asdict()
        # Логика риска: GPA ниже 1.7
        data["is_risk"] = data["gpa"] < 1.7 if data["gpa"] else True
        students_list.append(data)

    return {
        "course": course,
        "total": total_count,
        "shown": len(students_list),
        "students": students_list
    }




@app.get("/analysis/top_students")
async def get_top_students(
    course: Optional[str] = None, 
    limit: int = 10, 
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    statement = (
        select(
            Student.iin,
            (Student.last_name + " " + Student.first_name).label("full_name"),
            Student.course,
            func.round(func.cast(func.avg(Grade.gpa), Numeric), 2).label("gpa")
        )
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id, Student.owner_id == UserId)
    )

    if course and course.isdigit():
        statement = statement.where(Student.course == int(course))

    statement = statement.group_by(Student.iin, Student.last_name, Student.first_name, Student.course)
    statement = statement.order_by(col("gpa").desc()).limit(limit)

    results = session.exec(statement).all()
    return {
        "found": bool(results),
        "students": [row._asdict() for row in results]
    }



@app.get("/stats/general")
async def get_general_stats(
    report_id: int = 1,
    session: Session = Depends(get_session)
):
    """Общая сводка: кол-во студентов, средний GPA и кол-во в группе риска"""
    
    # Считаем уникальных студентов и средний GPA
    # Используем FILTER для подсчета рисковых студентов (GPA < 1.7)
    statement = (
        select(
            func.count(func.distinct(Student.iin)).label("total_students"),
            func.round(func.cast(func.avg(Grade.gpa), Numeric), 2).label("avg_score"),
            func.count(func.distinct(Student.iin)).filter(Grade.gpa < 1.7).label("students_at_risk")
        )
        .join(Grade, Grade.student_iin == Student.iin)
        .where(Grade.report_id == report_id)
        .where(Student.owner_id == UserId)
    )
    
    res = session.exec(statement).first()
    
    return {
        "total_students": res.total_students or 0,
        "avg_score": float(res.avg_score or 0),
        "students_at_risk": res.students_at_risk or 0,
    }


@app.post("/api/guide/{key}/pdf")
async def upload_guide_pdf(
    key: str, 
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    """Загрузка PDF файла в базу данных Postgres"""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Разрешены только .pdf файлы")

    contents = await file.read()
    # Ограничение 10МБ
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "Файл слишком велик (макс. 10MB)")

    # Ищем раздел
    statement = select(GuideSection).where(GuideSection.key == key)
    section = session.exec(statement).first()
    
    if not section:
        raise HTTPException(404, "Раздел путеводителя не найден")

    # Обновляем данные
    section.pdf_filename = file.filename
    section.pdf_data = contents # В SQLModel запишется как байты
    
    session.add(section)
    session.commit()
    
    return {
        "status": "success",
        "filename": file.filename,
        "message": f"Файл успешно прикреплен к разделу '{key}'"
    }


@app.get("/api/guide/{key}")
async def get_guide_content(
    key: str, 
    session: Session = Depends(get_session)
):
    """Получение текстов раздела (без бинарного PDF)"""
    statement = select(GuideSection).where(GuideSection.key == key, GuideSection.active == True)
    doc = session.exec(statement).first()
    
    if not doc:
        raise HTTPException(404, "Раздел не найден")
    
    # Возвращаем объект, исключая само поле pdf_data (оно слишком тяжелое)
    result = doc.model_dump()
    result.pop("pdf_data", None) 
    
    return result
