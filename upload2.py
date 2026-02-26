import json
import psycopg2
from datetime import datetime

# Ваша строка подключения к Render
DATABASE_URL = "postgresql://shyna:zFssLpyztVWhz92024rEmsVibnhd5sXN@dpg-d65286npm1nc7385bjs0-a.virginia-postgres.render.com/diploma_db_bvrq"

def upload_topics_from_json(file_path):
    conn = None
    try:
        # 1. Читаем JSON файл
        with open(file_path, 'r', encoding='utf-8') as f:
            data_list = json.load(f)

        # 2. Подключаемся к базе
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # 3. SQL запрос для вставки
        # Мы перечисляем все 8 основных полей (id, created_at и updated_at заполнятся сами)
        sql = """
            INSERT INTO chat_topics (
                title_ru, title_kz, title_en, 
                "order", active, has_subtopics, action
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """

        for item in data_list:
            cur.execute(sql, (
                item.get('title_ru'),
                item.get('title_kz'),
                item.get('title_en'),
                item.get('order', 0),
                item.get('active', True),
                item.get('has_subtopics', False),
                item.get('action') # Технический ключ, например 'search_student'
            ))

        conn.commit()
        print(f"Успешно загружено {len(data_list)} тем из файла {file_path}")

    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    # Укажите имя вашего файла
    upload_topics_from_json('university_.chat_topics.json')