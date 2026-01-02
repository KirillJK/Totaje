# React + TypeScript + Tailwind + Node.js Application with Google OAuth

Полнофункциональное веб-приложение с аутентификацией через Google, построенное на современном стеке технологий.

## Стек технологий

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Passport.js (Google OAuth 2.0)
- Express Session

## Структура проекта

```
jktota/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Компоненты (Layout, Sidebar, TopBar, etc.)
│   │   ├── context/       # React Context (AuthContext)
│   │   ├── pages/         # Страницы приложения
│   │   ├── App.tsx        # Главный компонент приложения
│   │   └── main.tsx       # Entry point
│   └── package.json
├── server/                # Express backend
│   ├── config/           # Конфигурация (Passport)
│   ├── routes/           # API маршруты
│   └── index.ts          # Entry point сервера
├── .env                  # Переменные окружения
└── package.json          # Root package.json
```

## Установка и запуск

### 1. Установка зависимостей

```bash
# Установить зависимости для сервера
npm install

# Установить зависимости для клиента
cd client
npm install
cd ..
```

### 2. Настройка Google OAuth

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Скопируйте Client ID и Client Secret

### 3. Настройка переменных окружения

Создайте файл `.env` в корневой директории (или отредактируйте существующий):

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret_change_this
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
```

### 4. Запуск приложения

```bash
# Запустить и сервер, и клиент одновременно
npm run dev

# Или запустить отдельно:
npm run dev:server  # Сервер на http://localhost:3000
npm run dev:client  # Клиент на http://localhost:5173
```

## Основные функции

### Аутентификация
- Вход через Google OAuth 2.0
- Управление сессиями
- Защищенные маршруты
- Автоматическое перенаправление неавторизованных пользователей

### UI Компоненты
- **Sidebar**: Боковая навигационная панель с переключением
- **TopBar**: Верхняя панель с информацией о пользователе и кнопкой выхода
- **Layout**: Общий layout для всех страниц с sidebar и topbar
- **ProtectedRoute**: HOC для защиты маршрутов

### Страницы
- **/login**: Страница входа через Google
- **/dashboard**: Главная страница с общей информацией
- **/profile**: Профиль пользователя с фото и данными
- **/settings**: Настройки приложения

## API Endpoints

### Аутентификация
- `GET /auth/google` - Инициировать вход через Google
- `GET /auth/google/callback` - Callback для Google OAuth
- `GET /auth/logout` - Выход из системы
- `GET /auth/current-user` - Получить текущего пользователя

## Сборка для продакшена

```bash
# Собрать и сервер, и клиент
npm run build

# Запустить продакшен сервер
npm start
```

## Дополнительная информация

### Безопасность
- Используются HTTP-only cookies для сессий
- CORS настроен для разрешения запросов только с клиента
- Сессии защищены секретным ключом

### Разработка
- Hot Module Replacement (HMR) для быстрой разработки
- TypeScript для типобезопасности
- ESLint и Prettier для качества кода

## Troubleshooting

### Проблемы с Google OAuth
- Убедитесь, что redirect URI в Google Console совпадает с указанным в приложении
- Проверьте, что Google+ API включен для проекта

### Проблемы с CORS
- Убедитесь, что CLIENT_URL и SERVER_URL правильно настроены в .env
- Проверьте, что сервер запущен на порту 3000, а клиент на 5173

## Лицензия

ISC
