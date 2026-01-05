# Database Migrations

## Структура

Все SQL файлы в этой папке автоматически выполняются PostgreSQL при первом запуске контейнера в алфавитном порядке.

## Порядок выполнения

1. `000_init.sql` - Создание основной схемы БД
2. `001_increase_thumbnail_url_size.sql` - Миграция для изменения типа поля
3. Добавляйте новые миграции с префиксом `002_`, `003_` и т.д.

## Naming Convention

Формат имени файла: `{номер}_{описание}.sql`

Примеры:
- `000_init.sql` - Инициализация схемы
- `001_increase_thumbnail_url_size.sql` - Изменение размера поля
- `002_add_user_table.sql` - Добавление новой таблицы

## Важные моменты

1. **Миграции выполняются только при первом запуске** контейнера PostgreSQL
2. Если база уже существует (volume `postgres_data` сохранен), миграции не выполнятся
3. Чтобы применить миграции заново, удалите volume:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

## Создание новой миграции

1. Создайте файл с следующим номером: `00X_description.sql`
2. Сделайте миграцию идемпотентной (безопасной для повторного выполнения)
3. Добавьте комментарии с описанием и датой

### Пример идемпотентной миграции

```sql
-- Migration: Add new column
-- Date: 2025-01-03
-- Description: Add user_agent column to track client information

DO $$
BEGIN
    -- Check if column doesn't exist before adding
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'audio_queue'
        AND column_name = 'user_agent'
    ) THEN
        ALTER TABLE audio_queue
        ADD COLUMN user_agent VARCHAR(500);
    END IF;
END $$;
```

## Rollback миграций

PostgreSQL Docker не поддерживает автоматический rollback. Для отката:

1. Создайте файл с rollback скриптом вручную
2. Подключитесь к базе и выполните:
   ```bash
   docker exec -it jktota_postgres psql -U jktota -d jktota_db -f /path/to/rollback.sql
   ```

## Применение миграций к существующей базе

Если база уже запущена и нужно применить новые миграции:

```bash
# Подключитесь к контейнеру
docker exec -it jktota_postgres psql -U jktota -d jktota_db

# Выполните миграцию вручную
\i /docker-entrypoint-initdb.d/002_new_migration.sql
```

Или через команду:
```bash
docker exec -i jktota_postgres psql -U jktota -d jktota_db < database/002_new_migration.sql
```
