# Руководство по настройке проекта

## Быстрый старт

### Шаг 1: Установка зависимостей

```bash
# В корневой директории проекта
npm install

# Установка клиентских зависимостей
cd client
npm install
cd ..
```

### Шаг 2: Получение Google OAuth credentials

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Перейдите в **APIs & Services** > **Credentials**
4. Нажмите **Create Credentials** > **OAuth client ID**
5. Если требуется, настройте OAuth consent screen:
   - User Type: External
   - App name: Ваше название приложения
   - User support email: Ваш email
   - Developer contact: Ваш email
6. Создайте OAuth Client ID:
   - Application type: **Web application**
   - Name: Любое имя (например, "Development")
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
7. Скопируйте **Client ID** и **Client Secret**

### Шаг 3: Настройка .env файла

Откройте файл `.env` в корневой директории и замените значения:

```env
GOOGLE_CLIENT_ID=ваш_google_client_id
GOOGLE_CLIENT_SECRET=ваш_google_client_secret
SESSION_SECRET=случайная_строка_для_сессий
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
```

**Важно**:
- `SESSION_SECRET` должен быть случайной строкой (минимум 32 символа)
- Можно сгенерировать в Node.js: `require('crypto').randomBytes(32).toString('hex')`

### Шаг 4: Запуск приложения

```bash
npm run dev
```

Эта команда запустит:
- Backend сервер на `http://localhost:3000`
- Frontend приложение на `http://localhost:5173`

### Шаг 5: Тестирование

1. Откройте браузер и перейдите на `http://localhost:5173`
2. Вы должны увидеть страницу входа
3. Нажмите "Sign in with Google"
4. Выберите Google аккаунт
5. После успешной авторизации вы будете перенаправлены на Dashboard

## Структура приложения

### Frontend (client/)

```
client/src/
├── components/
│   ├── Layout.tsx          # Основной layout с sidebar и topbar
│   ├── Sidebar.tsx         # Боковая навигация
│   ├── TopBar.tsx          # Верхняя панель с профилем и logout
│   └── ProtectedRoute.tsx  # HOC для защищенных маршрутов
├── context/
│   └── AuthContext.tsx     # Context для управления аутентификацией
├── pages/
│   ├── Login.tsx          # Страница входа
│   ├── Dashboard.tsx      # Главная страница
│   ├── Profile.tsx        # Профиль пользователя
│   └── Settings.tsx       # Настройки
├── App.tsx                # Главный компонент с роутингом
├── main.tsx              # Entry point
└── index.css             # Tailwind стили
```

### Backend (server/)

```
server/
├── config/
│   └── passport.ts       # Настройка Passport.js для Google OAuth
├── routes/
│   └── auth.ts          # Маршруты аутентификации
└── index.ts             # Express сервер
```

## Основные команды

```bash
# Разработка
npm run dev              # Запустить и сервер, и клиент
npm run dev:server       # Только сервер
npm run dev:client       # Только клиент

# Сборка
npm run build           # Собрать проект
npm run build:server    # Собрать сервер
npm run build:client    # Собрать клиент

# Продакшен
npm start              # Запустить собранный проект
```

## Возможные проблемы и решения

### Ошибка "Invalid redirect_uri"
- Проверьте, что в Google Console добавлен точный redirect URI: `http://localhost:3000/auth/google/callback`
- URI чувствителен к регистру и должен точно совпадать

### CORS ошибки
- Убедитесь, что в `.env` указаны правильные URL
- Сервер должен быть на порту 3000, клиент на 5173

### Сессия не сохраняется
- Проверьте, что `SESSION_SECRET` установлен в `.env`
- В браузере должны быть разрешены cookies

### "Cannot find module" ошибки
- Убедитесь, что установлены все зависимости:
  ```bash
  npm install
  cd client && npm install
  ```

## Следующие шаги

После успешной настройки вы можете:

1. **Добавить базу данных**: Интегрировать MongoDB, PostgreSQL или другую БД для хранения пользователей
2. **Расширить функциональность**: Добавить новые страницы и функции
3. **Настроить стили**: Кастомизировать Tailwind theme в `client/tailwind.config.js`
4. **Добавить middleware**: Реализовать дополнительные проверки безопасности
5. **Deploy**: Развернуть на Vercel, Heroku, AWS или другом хостинге

## Полезные ссылки

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
