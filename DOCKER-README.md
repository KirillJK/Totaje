# Docker Setup для JKTota

## Быстрый старт

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# Telegram Bot (ОБЯЗАТЕЛЬНО для работы бота!)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# URLs (важно для OAuth редиректов)
SERVER_URL=http://localhost:3000
CLIENT_URL=http://localhost:5173

# Todoist
TODOIST_API_TOKEN=your_todoist_token

# Session
SESSION_SECRET=your_random_session_secret

# PostgreSQL (опционально, есть значения по умолчанию)
POSTGRES_USER=jktota
POSTGRES_PASSWORD=jktota123
POSTGRES_DB=jktota_db
```

**Важно:**
- Для получения токена Telegram бота см. инструкцию в файле `TELEGRAM-SETUP.md`
- Для Google OAuth необходимо настроить разрешенные URI в [Google Cloud Console](https://console.cloud.google.com/):
  - Authorized JavaScript origins: `http://localhost:3000`
  - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`

### 2. Сборка контейнеров

```bash
# Windows
build-docker.bat

# Linux/Mac
docker-compose build
```

### 3. Запуск всех сервисов

```bash
# Windows
start-docker.bat

# Linux/Mac
docker-compose up -d
```

### 4. Остановка сервисов

```bash
# Windows
stop-docker.bat

# Linux/Mac
docker-compose down
```

## Доступ к сервисам

После запуска сервисы будут доступны по следующим адресам:

- **Frontend (Client)**: http://localhost:5173
- **Backend (Server)**: http://localhost:3000
- **YouTube Service API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f youtube-service
docker-compose logs -f telegram-bot
docker-compose logs -f postgres
```

### Перезапуск сервиса

```bash
docker-compose restart server
```

### Пересборка контейнера

```bash
# Пересобрать и перезапустить
docker-compose up -d --build server

# Пересобрать все
docker-compose build --no-cache
```

### Подключение к контейнеру

```bash
# Bash в контейнере
docker exec -it jktota_server sh
docker exec -it jktota_telegram_bot bash

# PostgreSQL
docker exec -it jktota_postgres psql -U jktota -d jktota_db
```

### Очистка

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить контейнеры и volumes
docker-compose down -v

# Удалить все (включая images)
docker-compose down -v --rmi all
```

## Архитектура

```
┌─────────────────┐
│     Client      │  (nginx:alpine) Port 5173
│  React + Vite   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│     Server      │  (node:20-alpine) Port 3000
│ Node.js/Express │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   PostgreSQL    │  (postgres:15-alpine) Port 5432
│    Database     │
└─────────────────┘
         ↑
         │
    ┌────┴────┬──────────────┐
    │         │              │
┌───┴────┐ ┌──┴───────┐ ┌───┴─────────┐
│YouTube │ │Telegram  │ │   Server    │
│Service │ │   Bot    │ │             │
└────────┘ └──────────┘ └─────────────┘
```

## Структура файлов

```
jktota/
├── docker-compose.yml           # Конфигурация всех сервисов
├── build-docker.bat            # Скрипт сборки (Windows)
├── start-docker.bat            # Скрипт запуска (Windows)
├── stop-docker.bat             # Скрипт остановки (Windows)
├── .dockerignore               # Исключения для корневого контекста
├── .env                        # Переменные окружения (не в git)
│
├── server/
│   ├── Dockerfile              # Dockerfile для сервера
│   └── ...
│
├── client/
│   ├── Dockerfile              # Dockerfile для клиента
│   ├── .dockerignore
│   └── ...
│
├── telegram-bot/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── ...
│
└── youtube-service/
    ├── Dockerfile
    ├── .dockerignore
    └── ...
```

## Volumes

- `postgres_data` - данные PostgreSQL (сохраняются между перезапусками)
- `downloads` - скачанные видео/аудио файлы (общие для youtube-service и telegram-bot)

## Сеть

Все сервисы находятся в одной Docker-сети `jktota-network`, что позволяет им общаться друг с другом по именам контейнеров.

## Troubleshooting

### Порты заняты

Если порты 5173, 3000, 3001 или 5432 уже заняты, измените их в `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Вместо 5173:80
```

### База данных не инициализируется

Удалите volume и пересоздайте:

```bash
docker-compose down -v
docker-compose up -d
```

### Миграции базы данных

Все SQL файлы из папки `database/` автоматически выполняются при первом запуске PostgreSQL:
- `000_init.sql` - создание схемы
- `001_increase_thumbnail_url_size.sql` - миграция

**Важно:** Миграции выполняются только при первом создании базы. Если нужно применить новые миграции к существующей базе:

```bash
# Вариант 1: Пересоздать базу (удалятся все данные!)
docker-compose down -v
docker-compose up -d

# Вариант 2: Применить миграцию вручную
docker exec -i jktota_postgres psql -U jktota -d jktota_db < database/002_new_migration.sql
```

Подробнее см. `database/README.md`

### Ошибки при сборке

Очистите Docker cache:

```bash
docker system prune -a
docker-compose build --no-cache
```

### Telegram Bot не подключается

**Ошибка "TELEGRAM_BOT_TOKEN not set":**

1. Убедитесь, что токен добавлен в `.env` файл:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

2. Проверьте, что токен валидный (получен от [@BotFather](https://t.me/BotFather))

3. Пересоздайте контейнер с новыми переменными:
   ```bash
   docker-compose up -d --force-recreate telegram-bot
   ```

4. Проверьте логи:
   ```bash
   docker-compose logs -f telegram-bot
   ```

**См. полную инструкцию в файле `TELEGRAM-SETUP.md`**

### YouTube Service не может скачать видео

Убедитесь, что в контейнере установлен `ffmpeg` (уже включен в Dockerfile).
