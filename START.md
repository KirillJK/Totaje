# Быстрый запуск проекта

## Первичная настройка

### 1. Установка зависимостей Node.js
```bash
npm install
cd client && npm install
cd ..
```

### 2. Установка зависимостей Python

**Для telegram-bot:**
```bash
cd telegram-bot
pip install -r requirements.txt
cd ..
```

**Для youtube-service:**
```bash
cd youtube-service
pip install -r requirements.txt
cd ..
```

### 3. Настройка переменных окружения
Создайте `.env` файл в корне проекта с необходимыми параметрами.

## Запуск всех сервисов

### Вариант 1: Через npm (рекомендуется)
```bash
npm run dev:all
```

### Вариант 2: Через bat-файл
Дважды кликните на `start-all.bat` или запустите:
```bash
start-all.bat
```

## Запуск отдельных сервисов

- **Server (Node.js/Express):** `npm run dev:server`
- **Client (React/Vite):** `npm run dev:client`
- **Telegram Bot:** `npm run dev:telegram`
- **YouTube Service:** `npm run dev:youtube`

## Что запускается

1. **Server** (порт 3000) - Node.js/Express бэкенд
2. **Client** (порт 5173) - React фронтенд на Vite
3. **Telegram Bot** - Telegram бот для скачивания видео
4. **YouTube Service** (порт 3001) - FastAPI сервис для обработки видео
