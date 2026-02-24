# from fastapi import FastAPI, UploadFile, File, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# from motor.motor_asyncio import AsyncIOMotorClient
# from bson import Binary
# import io
# from datetime import datetime
# from collections import defaultdict, OrderedDict

# app = FastAPI(title="StudentPerf API")

# # CORS — разрешаем фронтенду общаться с бэкендом
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], # В продакшене замени на конкретные домены
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # MongoDB Connection
# MONGO_URI = "mongodb://localhost:27017"
# client = AsyncIOMotorClient(MONGO_URI)
# db = client["university_db"]
# students_collection = db["students"]
# topics_collection = db["chat_topics"]
# guide_collection = db["guide_sections"]

# # --- МОДЕЛИ ДАННЫХ ---
# class StudentSearch(BaseModel):
#     query: str

# # --- ЭНДПОИНТЫ ТЕМ ЧАТА ---
# @app.get("/api/chat_topics")
# async def get_chat_topics():
#     cursor = topics_collection.find({}, {"_id": 0}).sort("order", 1)
#     return await cursor.to_list(length=50)

# # --- ПОИСК СТУДЕНТА ---
# @app.post("/search_student")
# async def search_student(search: StudentSearch):
#     query = search.query.strip()
#     if not query: raise HTTPException(400, "Запрос пуст")

#     pipeline = [
#         {"$match": {
#             "$or": [
#                 {"iin": query},
#                 {"last_name": {"$regex": query, "$options": "i"}},
#                 {"first_name": {"$regex": query, "$options": "i"}}
#             ]
#         }},
#         {"$addFields": {
#             "full_name": {"$trim": {"input": {"$concat": [
#                 {"$ifNull": ["$last_name", ""]}, " ", 
#                 {"$ifNull": ["$first_name", ""]}, " ", 
#                 {"$ifNull": ["$middle_name", ""]}
#             ]}}},
#             "gpa": {"$round": [{"$ifNull": ["$cumulative_gpa", {"$ifNull": ["$gpa", 0]}]}, 2]}
#         }},
#         {"$project": {"_id": 0}}, # Убираем ObjectId для JSON
#         {"$limit": 50}
#     ]
    
#     raw_students = await students_collection.aggregate(pipeline).to_list(50)
#     if not raw_students: return {"found": False}

#     # Группировка по ИИН (если один студент в разных записях)
#     results = []
#     # (Здесь твоя логика группировки из кода выше)
#     # Для краткости возвращаем агрегированный список
#     return {"found": True, "results": raw_students}

# # --- АНАЛИЗ ПО КУРСУ ---
# @app.get("/analysis/by_course/{course}")
# async def analysis_by_course(course: str):
#     course_val = int(course) if course.isdigit() else (5 if "магистр" in course.lower() else 1)
    
#     pipeline = [
#         {"$match": {"current_course": course_val}},
#         {"$group": {
#             "_id": "$iin",
#             "gpa": {"$first": "$cumulative_gpa"},
#             "status": {"$first": "$academic_status"}
#         }},
#         {"$group": {
#             "_id": None,
#             "total_students": {"$sum": 1},
#             "avg_gpa": {"$avg": "$gpa"},
#             "success_count": {"$sum": {"$cond": [{"$gte": ["$gpa", 2.0]}, 1, 0]}},
#             "at_risk": {"$sum": {"$cond": [{"$or": [{"$lt": ["$gpa", 1.7]}, {"$ne": ["$status", "Полный"]}]}, 1, 0]}}
#         }},
#         {"$project": {
#             "_id": 0,
#             "total_students": 1,
#             "avg_gpa": {"$round": ["$avg_gpa", 2]},
#             "success_rate": {"$round": [{"$multiply": [{"$divide": ["$success_count", {"$max": ["$total_students", 1]}]}, 100]}, 1]},
#             "at_risk": 1,
#             "at_risk_percent": {"$round": [{"$multiply": [{"$divide": ["$at_risk", {"$max": ["$total_students", 1]}]}, 100]}, 1]}
#         }}
#     ]
#     res = await students_collection.aggregate(pipeline).to_list(1)
#     return res[0] if res else {"total_students": 0, "avg_gpa": 0}

# # --- ПУТЕВОДИТЕЛЬ (GUIDE) ---
# @app.get("/api/guide_sections")
# async def get_guide_sections():
#     cursor = guide_collection.find({"active": True}, {"_id": 0, "pdf_data": 0}).sort("order", 1)
#     return await cursor.to_list(30)

# @app.get("/api/guide/{key}")
# async def get_guide_content(key: str):
#     doc = await guide_collection.find_one({"key": key, "active": True}, {"_id": 0, "pdf_data": 0})
#     if not doc: raise HTTPException(404, "Раздел не найден")
#     return doc

# @app.get("/api/guide/{key}/pdf/{action}")
# async def serve_guide_pdf(key: str, action: str):
#     doc = await guide_collection.find_one({"key": key}, {"pdf_data": 1, "pdf_filename": 1})
#     if not doc or "pdf_data" not in doc: raise HTTPException(404, "PDF отсутствует")
    
#     disposition = "inline" if action == "view" else "attachment"
#     return StreamingResponse(
#         io.BytesIO(doc["pdf_data"]),
#         media_type="application/pdf",
#         headers={"Content-Disposition": f'{disposition}; filename="{doc["pdf_filename"]}"'}
#     )

# # --- АНАЛИЗ ДИСЦИПЛИНЫ ---
# @app.get("/analysis/by_subject")
# async def analysis_by_subject(subject: str):
#     pipeline = [
#         {"$match": {"subject_name": {"$regex": subject, "$options": "i"}}},
#         {"$group": {
#             "_id": None,
#             "total_students": {"$addToSet": "$iin"},
#             "avg_score": {"$avg": "$final_score"},
#             "max_score": {"$max": "$final_score"},
#             "passed": {"$sum": {"$cond": [{"$gte": ["$final_score", 50]}, 1, 0]}}
#         }},
#         {"$project": {
#             "_id": 0,
#             "total_students": {"$size": "$total_students"},
#             "avg_score": {"$round": ["$avg_score", 2]},
#             "max_score": 1,
#             "success_rate": {"$round": [{"$multiply": [{"$divide": ["$passed", {"$max": [{"$size": "$total_students"}, 1]}]}, 100]}, 1]}
#         }}
#     ]
#     result = await students_collection.aggregate(pipeline).to_list(1)
#     return result[0] if result else {"found": False}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)


from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

from bson import ObjectId
from bson.binary import Binary

import pandas as pd
import matplotlib.pyplot as plt

from datetime import datetime
from typing import List, Dict, Any
from collections import defaultdict, OrderedDict

from io import BytesIO
import io
import base64


app = FastAPI(title="StudentPerf API")

# CORS — для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
     "http://localhost:5502",
        "http://127.0.0.1:5502",
        "http://localhost:3000",
        "http://localhost:8000",# если используешь vite/react
        "*"
    ],  # в продакшене → ["http://localhost:5173", "https://твой-домен"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URI = "mongodb://localhost:27017"
client = AsyncIOMotorClient(MONGO_URI)
db = client["Students"]

students_collection = db["data"]
reports_collection = db["reports"]
topics_collection = db["chat_topics"]   # ← новая коллекция для тем чата

# ────────────────────────────────────────────────
# Получение списка активных тем для чата
# ────────────────────────────────────────────────
@app.get("/api/chat_topics")
async def get_chat_topics():
    cursor = topics_collection.find(
        projection={
            "_id": 0,
            "title_ru": 1,
            "title_kz": 1,
            "title_en": 1,
            "order": 1,
            "has_subtopics": 1,
            "action": 1,
        },
    ).sort("order", 1)
    topics = await cursor.to_list(length=50)
    return topics


# ────────────────────────────────────────────────
@app.get("/analysis/at_risk")
async def get_at_risk_students(threshold: str = "all", limit: int = 10):
    """
    threshold:
    - 'critical'   → GPA < 1.0
    - 'low'        → GPA < 1.5
    - 'multiple_low' → ≥2 предметов < 50
    - 'all'        → любой из вышеуказанных
    """
    pipeline = [
        {
            "$addFields": {
                "avg_score": {"$avg": "$subjects.score"},
                "low_scores_count": {
                    "$size": {
                        "$filter": {
                            "input": "$subjects",
                            "as": "sub",
                            "cond": {"$lt": ["$$sub.score", 50]},
                        }
                    }
                },
            }
        },
        {
            "$match": {
                "$or": [
                    (
                        {"avg_score": {"$lt": 1.0}}
                        if threshold in ["critical", "all"]
                        else {"_id": None}
                    ),
                    (
                        {"avg_score": {"$lt": 1.5}}
                        if threshold in ["low", "all"]
                        else {"_id": None}
                    ),
                    (
                        {"low_scores_count": {"$gte": 2}}
                        if threshold in ["multiple_low", "all"]
                        else {"_id": None}
                    ),
                ]
            }
        },
        {
            "$project": {
                "_id": 0,  # ← Самое важное: исключаем ObjectId из результата
                "full_name": 1,
                "iin": 1,
                "course": 1,
                "group": 1,
                "gpa": {"$round": ["$avg_score", 2]},
                "low_scores": "$low_scores_count",
            }
        },
        {"$sort": {"gpa": 1}},
        {"$limit": limit},
    ]

    students = await students_collection.aggregate(pipeline).to_list(limit)

    # Подсчёт общего количества под риском (без лимита)
    total_pipeline = pipeline[:-2]  # убираем $sort и $limit
    total_pipeline.append({"$count": "total"})
    total_result = await students_collection.aggregate(total_pipeline).to_list(1)
    total_at_risk = total_result[0]["total"] if total_result else 0

    return {
        "found": bool(students),
        "total_at_risk": total_at_risk,
        "students": students,
    }
# ────────────────────────────────────────────────


# ────────────────────────────────────────────────
# Простая общая статистика по всей базе
# ────────────────────────────────────────────────
@app.get("/stats/general")
async def get_general_stats():
    pipeline = [
        {"$unwind": "$subjects"},
        {
            "$group": {
                "_id": None,
                "total_students": {"$addToSet": "$iin"},
                "avg_score": {"$avg": "$subjects.score"},
                "low_scores": {
                    "$sum": {"$cond": [{"$lt": ["$subjects.score", 50]}, 1, 0]}
                },
            }
        },
        {
            "$project": {
                "total_students": {"$size": "$total_students"},
                "avg_score": {"$round": ["$avg_score", 2]},
                "students_at_risk": {
                    "$sum": {
                        "$cond": [
                            {
                                "$or": [
                                    {"$lt": ["$avg_score", 1.7]},
                                    {"$gte": ["$low_scores", 2]},
                                ]
                            },
                            1,
                            0,
                        ]
                    }
                },
            }
        },
    ]
    result = await students_collection.aggregate(pipeline).to_list(1)
    if result:
        stats = result[0]
        return {
            "total_students": stats.get("total_students", 0),
            "avg_score": stats.get("avg_score", 0),
            "students_at_risk": stats.get("students_at_risk", 0),
        }
    return {"total_students": 0, "avg_score": 0, "students_at_risk": 0}


# Поиск студента (твой старый код, слегка улучшен)
class StudentSearch(BaseModel):
    query: str

# Ищем студента по ИИН или части имени (регистронезависимо) итогывый 
@app.post("/search_student")
async def search_student(search: StudentSearch):
    query = search.query.strip()
    
    if not query:
        raise HTTPException(400, "Запрос не может быть пустым")

    pipeline = [
        {
            "$match": {
                "$or": [
                    {"iin": query},
                    {"last_name": {"$regex": query, "$options": "i"}},
                    {"first_name": {"$regex": query, "$options": "i"}},
                    {"middle_name": {"$regex": query, "$options": "i"}},
                ]
            }
        },
        # 1. Сначала собираем полное имя через $concat
        {
            "$addFields": {
                "full_name_raw": {
                    "$concat": [
                        {"$ifNull": ["$last_name", ""]},
                        " ",
                        {"$ifNull": ["$first_name", ""]},
                        " ",
                        {"$ifNull": ["$middle_name", ""]}
                    ]
                }
            }
        },
        # 2. Теперь чистим пробелы с помощью $trim
        {
            "$addFields": {
                "full_name": {"$trim": {"input": "$full_name_raw"}},
                
                # GPA с приоритетом cumulative_gpa
                "gpa": {
                    "$round": [
                        {
                            "$ifNull": [
                                "$cumulative_gpa",
                                {"$ifNull": ["$gpa", {"$ifNull": ["$yearly_gpa", 0]}]}
                            ]
                        },
                        2
                    ]
                },
                
                "course": {"$ifNull": ["$current_course", "$course", "—"]},
                
                # Остальные поля без изменений
                "subject_code": "$subject_code",
                "subject_name": "$subject_name",
                "attestation1_score": "$attestation1_score",
                "attestation2_score": "$attestation2_score",
                "exam_score": "$exam_score",
                "final_score": "$final_score",
                "letter_grade": "$letter_grade"
            }
        },
        # Удаляем временное поле (чище результат)
        {"$unset": "full_name_raw"},
        
        {"$sort": {"last_name": 1, "first_name": 1}},
        {"$limit": 50}
    ]

    try:
        raw_students = await students_collection.aggregate(pipeline).to_list(50)
    except Exception as e:
        print("Ошибка в aggregation:", str(e))  # ← для логов сервера
        raise HTTPException(500, f"Ошибка базы данных: {str(e)}")

    if not raw_students:
        return {"found": False, "message": "Никто не найден"}

    # Группировка и обработка — без изменений
    grouped = defaultdict(list)
    for s in raw_students:
        key = (
            s.get("iin", ""),
            s.get("full_name", "").strip(),
            s.get("specialty_code", "—"),
            s.get("specialty_name", "—"),
            s.get("curriculum_year", "—"),
            s.get("admission_year", "—"),
            s.get("course", "—"),
            s.get("payment_form", "—"),
            s.get("study_language", "—"),
            s.get("study_form", "—"),
            s.get("study_level", "—"),
            s.get("academic_status", "—"),
            s.get("status", "—")
        )
        grouped[key].append(s)

    results = []
    for key, group in grouped.items():
        first = group[0]

        subjects_map = OrderedDict()
        for record in group:
            code = record.get("subject_code")
            if code and code not in subjects_map:
                subjects_map[code] = {
                    "subject_code": code,
                    "subject_name": record.get("subject_name", "—"),
                    "attestation1_score": record.get("attestation1_score", 0),
                    "attestation2_score": record.get("attestation2_score", 0),
                    "exam_score": record.get("exam_score", 0),
                    "final_score": record.get("final_score", 0),
                    "letter_grade": record.get("letter_grade", "—")
                }

        all_subjects = list(subjects_map.values())

        results.append({
            "iin": first.get("iin", ""),
            "full_name": first.get("full_name", ""),
            "last_name": first.get("last_name", ""),
            "first_name": first.get("first_name", ""),
            "middle_name": first.get("middle_name", ""),
            "specialty_code": first.get("specialty_code", "—"),
            "specialty_name": first.get("specialty_name", "—"),
            "curriculum_year": first.get("curriculum_year", "—"),
            "admission_year": first.get("admission_year", "—"),
            "course": first.get("course", "—"),
            "payment_form": first.get("payment_form", "—"),
            "study_language": first.get("study_language", "—"),
            "study_form": first.get("study_form", "—"),
            "study_level": first.get("study_level", "—"),
            "academic_status": first.get("academic_status", "—"),
            "status": first.get("status", "—"),
            "gpa": first.get("gpa", 0),
            "subjects_count": len(all_subjects),
            "all_subjects": all_subjects
        })

    return {"found": True, "results": results}

# ────────────────────────────────────────────────
# Анализ по конкретному курсу
# ────────────────────────────────────────────────

@app.get("/analysis/by_course/{course}")
async def analysis_by_course(course: str):
    try:
        course_val = int(course) if course.isdigit() else None
    except ValueError:
        course_val = None

    match_stage = {}
    if course_val is not None:
        match_stage = {"current_course": course_val}
    elif course.lower() in ["магистратура", "magistratura"]:
        match_stage = {"current_course": {"$gte": 5}}
    else:
        return {"error": "Неверный курс"}

    pipeline = [
        {"$match": match_stage},

        # Самое важное — приоритет ТОЛЬКО cumulative_gpa
        # Если его нет или 0 — берём 0 (никаких final_score!)
        {
            "$addFields": {
                "gpa": {
                    "$cond": [
                        {"$gt": [{"$ifNull": ["$cumulative_gpa", 0]}, 0]},
                        "$cumulative_gpa",
                        0   # ← если cumulative_gpa нет или 0 → GPA = 0
                    ]
                },
                "is_at_risk": {
                    "$or": [
                        {"$lt": [{"$ifNull": ["$cumulative_gpa", 999]}, 1.7]},
                        {"$ne": ["$academic_status", "Полный"]}
                    ]
                }
            }
        },

        # Группируем по студентам (чтобы один студент не считался много раз)
        {
            "$group": {
                "_id": "$iin",
                "gpa": {"$first": "$gpa"},
                "is_at_risk": {"$first": "$is_at_risk"}
            }
        },

        # Общая статистика
        {
            "$group": {
                "_id": None,
                "total_students": {"$sum": 1},
                "avg_gpa": {"$avg": "$gpa"},
                "success_count": {
                    "$sum": {"$cond": [{"$gte": ["$gpa", 2.0]}, 1, 0]}   # ← обычно >= 2.0 считается успеваемостью
                },
                "at_risk_count": {
                    "$sum": {"$cond": ["$is_at_risk", 1, 0]}
                }
            }
        },

        {
            "$project": {
                "total_students": 1,
                "avg_gpa": {"$round": ["$avg_gpa", 2]},
                "success_rate": {
                    "$cond": [
                        {"$eq": ["$total_students", 0]},
                        0,
                        {"$round": [{"$multiply": [{"$divide": ["$success_count", "$total_students"]}, 100]}, 1]}
                    ]
                },
                "at_risk": "$at_risk_count",
                "at_risk_percent": {
                    "$cond": [
                        {"$eq": ["$total_students", 0]},
                        0,
                        {"$round": [{"$multiply": [{"$divide": ["$at_risk_count", "$total_students"]}, 100]}, 1]}
                    ]
                }
            }
        }
    ]

    result = await students_collection.aggregate(pipeline).to_list(1)

    if not result or not result[0].get("total_students"):
        return {
            "course": course,
            "total_students": 0,
            "avg_gpa": 0,
            "success_rate": 0,
            "at_risk": 0,
            "at_risk_percent": 0,
            "message": "На этом курсе пока нет студентов"
        }


    stats = result[0]
    return {
        "course": course,
        **stats,
        "message": "Средний GPA взят из поля cumulative_gpa"
    }
    
@app.get("/analysis/course_students/{course}")
async def get_course_students(course: str, limit: int = 50):
    try:
        course_val = int(course) if course.isdigit() else None
    except ValueError:
        course_val = None

    match = {"current_course": course_val} if course_val is not None else \
            {"current_course": {"$gte": 5}} if course.lower() in ["магистратура", "magistratura"] else \
            None

    if match is None:
        raise HTTPException(400, "Неверный курс")

    pipeline = [
        {"$match": match},
        {
            "$addFields": {
                "full_name": {
                    "$trim": {
                        "$concat": [
                            {"$ifNull": ["$last_name", ""]}, " ",
                            {"$ifNull": ["$first_name", ""]}, " ",
                            {"$ifNull": ["$middle_name", ""]}
                        ]
                    }
                },
                "gpa": {
                    "$cond": [
                        {"$gt": [{"$ifNull": ["$cumulative_gpa", 0]}, 0]},
                        "$cumulative_gpa",
                        0.0  # или fallback на перевод final_score в 4-балльную, см. выше
                    ]
                },
                "is_risk": {
                    "$or": [
                        {"$lt": ["$gpa", 1.7]},
                        {"$lt": [{"$ifNull": ["$final_score", 0]}, 50]},
                        {"$ne": ["$academic_status", "Полный"]}
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "iin": 1,
                "full_name": 1,
                "gpa": {"$round": ["$gpa", 2]},
                "is_risk": 1,
                "specialty_name": 1,
                "academic_status": 1,
                "final_score": 1,
                "letter_grade": 1
            }
        },
        {"$sort": {"gpa": 1}},
        {"$limit": limit}
    ]

    try:
        students = await students_collection.aggregate(pipeline).to_list(limit)
        total = await students_collection.count_documents(match)
    except Exception as e:
        print("Ошибка в course_students:", str(e))
        raise HTTPException(500, f"Ошибка базы: {str(e)}")

    return {
        "course": course,
        "total": total,
        "shown": len(students),
        "students": students
    }
    try:
        course_val = int(course) if course.isdigit() else None
    except ValueError:
        course_val = None

    match_stage = {}
    if course_val is not None:
        match_stage = {"current_course": course_val}
    elif course.lower() in ["магистратура", "magistratura"]:
        match_stage = {"current_course": {"$gte": 5}}
    else:
        raise HTTPException(400, "Неверный курс")

    pipeline = [
        {"$match": match_stage},
        {
            "$addFields": {
                "effective_gpa": {
                    "$cond": [
                        {"$gt": [{"$ifNull": ["$cumulative_gpa", 0]}, 0]},
                        "$cumulative_gpa",
                        {"$ifNull": ["$final_score", 0]}
                    ]
                },
                "full_name": {
                    "$trim": {
                        "$concat": [
                            {"$ifNull": ["$last_name", ""]}, " ",
                            {"$ifNull": ["$first_name", ""]}, " ",
                            {"$ifNull": ["$middle_name", ""]}
                        ]
                    }
                },
                "is_at_risk": {
                    "$or": [
                        {"$lt": [{"$ifNull": ["$cumulative_gpa", 999]}, 1.7]},
                        {"$lt": [{"$ifNull": ["$final_score", 0]}, 50]},
                        {"$ne": ["$academic_status", "Полный"]}
                    ]
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "iin": 1,
                "full_name": 1,
                "last_name": 1,
                "first_name": 1,
                "middle_name": 1,
                "specialty_name": 1,
                "specialty_code": 1,
                "payment_form": 1,
                "study_language": 1,
                "academic_status": 1,
                "status": 1,
                "cumulative_gpa": 1,
                "final_score": 1,
                "letter_grade": 1,
                "is_at_risk": 1
            }
        },
        {"$sort": {"effective_gpa": 1}},
        {"$limit": limit}
    ]

    students = await students_collection.aggregate(pipeline).to_list(limit)

    return {
        "course": course,
        "total": await students_collection.count_documents(match_stage),
        "shown": len(students),
        "students": students
    }

# ────────────────────────────────────────────────
# Топ студентов по GPA
# ────────────────────────────────────────────────
@app.get("/analysis/top_students")
async def get_top_students(course: str = None, limit: int = 10):
    """
    Топ студентов по GPA — работает с current_course как строкой или числом
    """
    match_stage = {}
    
    if course is not None:
        # Самый надёжный способ: приводим БАЗОВОЕ значение к строке и сравниваем как строки
        # Это работает для "4", " 4 ", "4.0" и даже если где-то число
        match_stage = {"current_course": {"$regex": f"^{course.strip()}$", "$options": "i"}}

        # Альтернатива (если хочешь строго): 
        # match_stage = {"current_course": course.strip()}

    pipeline = [
        {"$match": match_stage} if match_stage else {"$match": {}},

        {
            "$addFields": {
                "full_name": {
                    "$trim": {
                        "$concat": [
                            {"$ifNull": ["$last_name", ""]},
                            " ",
                            {"$ifNull": ["$first_name", ""]},
                            " ",
                            {"$ifNull": ["$middle_name", ""]}
                        ]
                    }
                },
                "gpa": {
                    "$round": [
                        {
                            "$ifNull": [
                                "$cumulative_gpa",
                                {"$ifNull": ["$gpa", {"$ifNull": ["$yearly_gpa", 0]}]}
                            ]
                        },
                        2
                    ]
                }
            }
        },
        {"$sort": {"gpa": -1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": 0,
                "full_name": 1,
                "last_name": 1,
                "first_name": 1,
                "middle_name": 1,
                "iin": 1,
                "course": "$current_course",
                "specialty_name": 1,
                "specialty_code": 1,
                "gpa": 1,
                "academic_status": 1,
                "status": 1,
                "payment_form": 1
            }
        }
    ]

    students = await students_collection.aggregate(pipeline).to_list(limit)

    return {
        "found": bool(students),
        "total_in_top": len(students),
        "students": students,
        "debug_info": {
            "requested_course": course,
            "match_used": match_stage,
            "found_count": len(students)
        }
    }
# ────────────────────────────────────────────────





#Сравнение двух курсов или групп

@app.get("/analysis/compare")
async def compare_groups_or_courses(type: str, value1: str, value2: str):
    """
    Сравнение курсов или групп
    type: "course" или "group"
    value1, value2: номера курсов (например "1", "4") или названия групп
    """
    async def get_stats(filter_field: str, filter_value: str):
        # Для курсов — приводим к int, для групп — оставляем строкой
        try:
            match_value = int(filter_value) if filter_field == "current_course" else filter_value
        except ValueError:
            match_value = filter_value

        pipeline = [
            # 1. Фильтр по курсу или группе
            {"$match": {filter_field: match_value}},

            # 2. Определяем реальный GPA и статус "под риском"
            {
                "$addFields": {
                    "effective_gpa": {
                        "$cond": [
                            {"$gt": [{"$ifNull": ["$cumulative_gpa", 0]}, 0]},
                            "$cumulative_gpa",
                            {"$ifNull": ["$final_score", 0]}
                        ]
                    },
                    "is_at_risk": {
                        "$or": [
                            {"$lt": [{"$ifNull": ["$cumulative_gpa", 999]}, 1.7]},
                            {"$lt": [{"$ifNull": ["$final_score", 0]}, 50]}
                        ]
                    }
                }
            },

            # 3. Группируем по уникальным студентам (по iin)
            # Это самое важное — чтобы один студент не считался несколько раз
            {
                "$group": {
                    "_id": "$iin",
                    "effective_gpa": {"$first": "$effective_gpa"},
                    "is_at_risk": {"$first": "$is_at_risk"}
                }
            },

            # 4. Считаем итоговую статистику
            {
                "$group": {
                    "_id": None,
                    "total_students": {"$sum": 1},
                    "avg_gpa": {"$avg": "$effective_gpa"},
                    "success_count": {
                        "$sum": {"$cond": [{"$gte": ["$effective_gpa", 50]}, 1, 0]}
                    },
                    "at_risk_count": {
                        "$sum": {"$cond": ["$is_at_risk", 1, 0]}
                    }
                }
            },

            # 5. Финальные расчёты
            {
                "$project": {
                    "total_students": 1,
                    "avg_gpa": {"$round": ["$avg_gpa", 2]},
                    "success_rate": {
                        "$cond": [
                            {"$eq": ["$total_students", 0]},
                            0,
                            {"$round": [{"$multiply": [{"$divide": ["$success_count", "$total_students"]}, 100]}, 1]}
                        ]
                    },
                    "at_risk": "$at_risk_count",
                    "at_risk_percent": {
                        "$cond": [
                            {"$eq": ["$total_students", 0]},
                            0,
                            {"$round": [{"$multiply": [{"$divide": ["$at_risk_count", "$total_students"]}, 100]}, 1]}
                        ]
                    }
                }
            }
        ]

        try:
            result = await students_collection.aggregate(pipeline).to_list(1)
            return result[0] if result else {
                "total_students": 0,
                "avg_gpa": 0,
                "success_rate": 0,
                "at_risk": 0,
                "at_risk_percent": 0
            }
        except Exception as e:
            print(f"Ошибка в get_stats ({filter_field}={filter_value}): {str(e)}")
            return {
                "total_students": 0,
                "avg_gpa": 0,
                "success_rate": 0,
                "at_risk": 0,
                "at_risk_percent": 0,
                "error": str(e)
            }

    # Получаем данные
    left = await get_stats("current_course" if type == "course" else "group", value1)
    right = await get_stats("current_course" if type == "course" else "group", value2)

    return {
        "found": True,
        "left": {**left, "label": value1},
        "right": {**right, "label": value2}
    }



@app.get("/analysis/by_subject")
async def analysis_by_subject(subject: str):
    subject = subject.strip()
    if len(subject) < 2:
        raise HTTPException(400, "Введите название дисциплины (минимум 2 символа)")

    pipeline = [
        # 1. Фильтр по дисциплине
        {"$match": {
            "subject_name": {"$regex": subject, "$options": "i"}
        }},

        # 2. Собираем все нужные данные
        {
            "$group": {
                "_id": None,
                "total_records": {"$sum": 1},
                "unique_students": {"$addToSet": "$iin"},
                "all_scores": {"$push": {"$ifNull": ["$final_score", 0]}},
                "passed": {
                    "$sum": {"$cond": [{"$gte": [{"$ifNull": ["$final_score", 0]}, 50]}, 1, 0]}
                },
                "max_score": {"$max": {"$ifNull": ["$final_score", 0]}}
            }
        },

        # 3. Основная статистика
        {
            "$project": {
                "found": {"$gt": ["$total_records", 0]},
                "total_students": {"$size": "$unique_students"},
                "avg_score": {"$round": [{"$avg": "$all_scores"}, 2]},
                "success_rate": {
                    "$cond": [
                        {"$eq": ["$total_records", 0]},
                        0,
                        {"$round": [{"$multiply": [{"$divide": ["$passed", {"$size": "$unique_students"}]}, 100]}, 1]}
                    ]
                },
                "passed": "$passed",
                "failed": {"$subtract": [{"$size": "$unique_students"}, "$passed"]},
                "max_score": 1
            }
        },

        # 4. Дополнительно: статистика по специальностям (отдельный lookup или вторая агрегация)
        # Для этого делаем вторую агрегацию
        {
            "$lookup": {
                "from": "students",
                "let": {"subj": subject},
                "pipeline": [
                    {"$match": {
                        "$expr": {
                            "$and": [
                                {"$regexMatch": {"input": "$subject_name", "regex": "$$subj", "options": "i"}},
                            ]
                        }
                    }},
                    {"$group": {
                        "_id": "$specialty_code",
                        "specialty_name": {"$first": "$specialty_name"},
                        "total_students": {"$addToSet": "$iin"},
                        "avg_score": {"$avg": {"$ifNull": ["$final_score", 0]}}
                    }},
                    {"$project": {
                        "specialty_code": "$_id",
                        "specialty_name": 1,
                        "total_students": {"$size": "$total_students"},
                        "avg_score": {"$round": ["$avg_score", 2]}
                    }},
                    {"$sort": {"avg_score": -1}},
                    {"$limit": 5}  # топ-5 специальностей
                ],
                "as": "specialties"
            }
        },

        # 5. Финальный проект
        {
            "$project": {
                "found": 1,
                "total_students": 1,
                "avg_score": 1,
                "success_rate": 1,
                "passed": 1,
                "failed": 1,
                "max_score": 1,
                "best_specialty": {"$arrayElemAt": ["$specialties", 0]},
                "worst_specialty": {"$arrayElemAt": ["$specialties", -1]},
                "top3_specialties": {"$slice": ["$specialties", 3]}
            }
        }
    ]

    try:
        result = await students_collection.aggregate(pipeline).to_list(1)
        if not result:
            return {"found": False, "total_students": 0, "avg_score": 0, "success_rate": 0, "passed": 0, "failed": 0, "max_score": 0, "best_specialty": None, "worst_specialty": None, "top3_specialties": []}

        stats = result[0]
        return stats

    except Exception as e:
        print(f"Ошибка /analysis/by_subject ('{subject}'): {str(e)}")
        raise HTTPException(500, f"Ошибка: {str(e)}")


async def compare_groups_or_courses(type: str, value1: str, value2: str):
    async def get_stats(filter_field: str, filter_value: str):
        # Преобразуем значение в int, если это курс
        match_value = int(filter_value) if filter_field == "course" else filter_value

        pipeline = [
            {"$match": {filter_field: match_value}},
            {"$addFields": {"avg_score": {"$avg": "$subjects.score"}}},
            {
                "$group": {
                    "_id": None,
                    "total_students": {"$sum": 1},
                    "avg_score": {"$avg": "$avg_score"},
                    "success_count": {
                        "$sum": {"$cond": [{"$gte": ["$avg_score", 50]}, 1, 0]}
                    },
                    "at_risk": {
                        "$sum": {"$cond": [{"$lt": ["$avg_score", 1.7]}, 1, 0]}
                    },
                }
            },
            {
                "$project": {
                    "total_students": 1,
                    "avg_score": {"$round": ["$avg_score", 2]},
                    "success_rate": {
                        "$cond": [
                            {"$eq": ["$total_students", 0]},
                            0,
                            {
                                "$multiply": [
                                    {"$divide": ["$success_count", "$total_students"]},
                                    100,
                                ]
                            },
                        ]
                    },
                    "at_risk": 1,
                }
            },
        ]

        # Асинхронно получаем результаты
        cursor = students_collection.aggregate(pipeline)
        results = await cursor.to_list(length=1)

        return (
            results[0]
            if results
            else {"total_students": 0, "avg_score": 0, "success_rate": 0, "at_risk": 0}
        )

    # Получаем статистику для двух значений
    left = await get_stats("course" if type == "course" else "group", value1)
    right = await get_stats("course" if type == "course" else "group", value2)

    return {"found": True, "left": left, "right": right}



# 3. Загрузка PDF в раздел (с ограничением размера и проверками)
@app.post("/api/guide/{key}/pdf")
async def upload_guide_pdf(key: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Разрешены только файлы .pdf")

    # Ограничение размера — 10 МБ (можно изменить)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(413, "Файл слишком большой (максимум 10 МБ)")

    result = await db.guide_sections.update_one(
        {"key": key, "active": True},
        {
            "$set": {
                "pdf_filename": file.filename,
                "pdf_data": Binary(contents),
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, f"Раздел с ключом '{key}' не найден или не активен")
    
    if result.modified_count == 0:
        return {"status": "warning", "message": "Файл не изменился (возможно, тот же самый)"}
    
    return {
        "status": "success",
        "filename": file.filename,
        "message": f"PDF успешно загружен в раздел '{key}'"
    }


# Получить все активные разделы (улучшенная версия)
@app.get("/api/guide_sections")
async def get_guide_sections():
    cursor = db.guide_sections.find(
        {"active": True},
        projection={
            "_id": 0,
            "key": 1,
            "order": 1,
            "icon": 1,                  # ← иконка (emoji или url)
            "title_ru": 1,
            "title_kz": 1,
            "title_en": 1,
            "short_ru": 1,              # ← короткое описание (опционально)
            "short_kz": 1,
            "short_en": 1,
            "pdf_filename": 1           # чтобы знать, есть ли PDF
        }
    ).sort("order", 1)
    
    sections = await cursor.to_list(30)
    return sections


# Получить содержимое раздела
@app.get("/api/guide/{key}")
async def get_guide_content(key: str):
    doc = await db.guide_sections.find_one(
        {"key": key, "active": True},
        projection={
            "_id": 0,
            "key": 1,
            "title_ru": 1, "title_kz": 1, "title_en": 1,
            "content_ru": 1, "content_kz": 1, "content_en": 1,
            "short_ru": 1, "short_kz": 1, "short_en": 1,
            "icon": 1,
            "links": 1,                 # массив ссылок, если нужно
            "pdf_filename": 1
        }
    )
    
    if not doc:
        raise HTTPException(404, "Раздел не найден")
    
    return doc


# Общий внутренний метод для отдачи PDF
async def serve_pdf(key: str, disposition: str = "inline"):
    doc = await db.guide_sections.find_one(
        {"key": key, "active": True},
        projection={"pdf_data": 1, "pdf_filename": 1}
    )
    
    if not doc or "pdf_data" not in doc:
        raise HTTPException(status_code=404, detail="PDF не найден для этого раздела")
    
    pdf_bytes = doc["pdf_data"]
    filename = doc.get("pdf_filename", "guide.pdf")
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes))
        }
    )

# 1. Для просмотра (открытие в браузере)
@app.get("/api/guide/{key}/pdf/view")
async def view_guide_pdf(key: str):
    return await serve_pdf(key, disposition="inline")

# 2. Для скачивания (всегда скачивает файл)
@app.get("/api/guide/{key}/pdf/download")
async def download_guide_pdf(key: str):
    return await serve_pdf(key, disposition="attachment")