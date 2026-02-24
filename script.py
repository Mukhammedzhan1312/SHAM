import json
from datetime import datetime
from sqlalchemy import create_engine, text

# Замени на свои данные подключения
DATABASE_URL = "postgresql://postgres:2005@localhost:5432/diploma_db"


engine = create_engine(DATABASE_URL)

def migrate_topics(json_file_path):
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with engine.begin() as conn:
        for item in data:
            # Извлекаем данные из формата MongoDB
            topic_id = item['_id']['$oid']
            # Обрабатываем даты (учитываем, что в одном объекте может не быть даты)
            created_at = item.get('created_at', {}).get('$date')
            updated_at = item.get('updated_at', {}).get('$date')

            conn.execute(
                text("""
                    INSERT INTO chat_topics 
                    (id, title_ru, title_kz, title_en, "order", active, has_subtopics, action, created_at, updated_at)
                    VALUES (:id, :ru, :kz, :en, :order, :active, :sub, :action, :created, :updated)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": topic_id,
                    "ru": item.get('title_ru'),
                    "kz": item.get('title_kz'),
                    "en": item.get('title_en'),
                    "order": item.get('order'),
                    "active": item.get('active'),
                    "sub": item.get('has_subtopics'),
                    "action": item.get('action'),
                    "created": created_at,
                    "updated": updated_at
                }
            )
    print("Миграция завершена успешно!")

migrate_topics('university_.chat_topics.json')