from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import os
from dotenv import load_dotenv
from sqlmodel import create_engine

load_dotenv()

# Строка подключения (поменяй на свои данные!)
# Формат: postgresql://пользователь:пароль@localhost:порт/имя_бд
DATABASE_URL = os.getenv("DATABASE_URL_LOCAL")
# "postgresql://postgres:passwd@localhost:5432/diploma_db"

engine = create_engine(DATABASE_URL,
    pool_pre_ping=True, # Проверяет живое ли соединение перед запросом 
    connect_args={"connect_timeout": 60})

def init_db():
    """Создает таблицы, если их нет"""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator:
    """Зависимость для получения сессии БД в каждом запросе"""
    with Session(engine) as session:
        yield session