# Настройка Telegram Bot

## 1. Получение токена бота

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям:
   - Введите имя бота (например: "JKTota Video Downloader")
   - Введите username бота (должен заканчиваться на `bot`, например: `jktota_video_bot`)
4. BotFather отправит вам токен в формате: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Скопируйте этот токен

## 2. Добавление токена в проект

### Для Docker:

Откройте файл `.env` в корне проекта и замените:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

На:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

### Для локальной разработки:

Также добавьте токен в `telegram-bot/.env`:
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
YOUTUBE_SERVICE_URL=http://localhost:3001
```

## 3. Перезапуск сервисов

### Docker:
```bash
# Пересоздать контейнер с новыми переменными
docker-compose up -d --force-recreate telegram-bot

# Или перезапустить все
docker-compose restart
```

### Локальная разработка:
```bash
npm run dev:telegram
```

## 4. Проверка работы

1. Откройте Telegram
2. Найдите вашего бота по username
3. Нажмите "Start" или отправьте `/start`
4. Бот должен ответить приветственным сообщением
5. Отправьте ссылку на YouTube видео для теста

## Возможные проблемы

### "TELEGRAM_BOT_TOKEN not set"
- Убедитесь, что токен добавлен в `.env` файл
- Проверьте, что в токене нет лишних пробелов
- Перезапустите контейнер: `docker-compose restart telegram-bot`

### Бот не отвечает
- Проверьте логи: `docker-compose logs -f telegram-bot`
- Убедитесь, что YouTube Service запущен: `docker-compose ps`
- Проверьте, что токен действителен в BotFather

### "Service not initialized"
- Проверьте, что PostgreSQL запущена
- Проверьте логи YouTube Service: `docker-compose logs -f youtube-service`
- Убедитесь, что база данных создана

## Команды бота

- `/start` - Начать работу с ботом
- `/help` - Показать справку
- Отправьте ссылку на видео (YouTube/Instagram) для скачивания

## Архитектура

```
┌──────────────┐
│ Telegram Bot │
└──────┬───────┘
       │ HTTP API
       ↓
┌─────────────────┐
│ YouTube Service │ ← FastAPI
└────────┬────────┘
         │
         ↓
   ┌──────────┐
   │PostgreSQL│
   └──────────┘
```

Бот взаимодействует с YouTube Service через REST API для управления очередью загрузок.
