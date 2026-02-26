import json
import base64
import psycopg2
from psycopg2.extras import Json

# Настройки подключения к PostgreSQL
# DB_CONFIG = {
#     "dbname": "diploma_db",
#     "user": "postgres",
#     "password": "2005",
#     "host": "localhost",
#     "port": "5432"
# }


# Просто заменяем словарь на строку
DATABASE_URL = "postgresql://shyna:zFssLpyztVWhz92024rEmsVibnhd5sXN@dpg-d65286npm1nc7385bjs0-a.virginia-postgres.render.com/diploma_db_bvrq"

# ...
# И меняем вызов функции (убираем две звездочки **)


def migrate_json_to_postgres(file_path):
    try:
        # 1. Загружаем данные из файла
        with open(file_path, 'r', encoding='utf-8') as f:
            data_list = json.load(f)

        # Подключаемся к базе
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        for item in data_list:
            print(f"Обработка раздела: {item.get('key')}")

            # 2. Декодируем PDF, если он есть в формате MongoDB ($binary)
            pdf_bytes = None
            if 'pdf_data' in item and item['pdf_data']:
                
                # Извлекаем строку base64
                b64_string = item['pdf_data']['$binary']['base64']
                pdf_bytes = base64.b64decode(b64_string)

            # 3. Подготовка SQL
            sql = """
                INSERT INTO guide_sections (
                    key, "order", icon, 
                    title_ru, title_kz, title_en, 
                    short_ru, short_kz, short_en, 
                    content_ru, content_kz, content_en, 
                    pdf_filename, links, active, pdf_data
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (key) DO UPDATE SET 
                    pdf_data = EXCLUDED.pdf_data,
                    content_ru = EXCLUDED.content_ru;
            """

            # Выполняем вставку
            cur.execute(sql, (
                item.get('key'),
                item.get('order'),
                item.get('icon'),
                item.get('title_ru'),
                item.get('title_kz'),
                item.get('title_en'),
                item.get('short_ru'),
                item.get('short_kz'),
                item.get('short_en'),
                item.get('content_ru'),
                item.get('content_kz'),
                item.get('content_en'),
                item.get('pdf_filename'),
                json.dumps(item.get('links', [])), # Конвертируем список в JSON для колонки JSONB
                item.get('active', True),
                psycopg2.Binary(pdf_bytes) if pdf_bytes else None
            ))

        conn.commit()
        print(f"--- Успешно загружено объектов: {len(data_list)} ---")

    except Exception as e:
        print(f"Критическая ошибка: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    # Укажите путь к вашему файлу здесь
    migrate_json_to_postgres('guide_sections.json')