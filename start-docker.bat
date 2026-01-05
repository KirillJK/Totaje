@echo off
echo ========================================
echo Starting JKTota Services with Docker
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found!
    echo Please create .env file with required environment variables.
    echo.
    echo Required variables:
    echo   - TELEGRAM_BOT_TOKEN
    echo   - GOOGLE_CLIENT_ID
    echo   - GOOGLE_CLIENT_SECRET
    echo   - TODOIST_API_TOKEN
    echo   - SESSION_SECRET
    echo.
    echo Copy .env.example to .env and fill in your values.
    pause
    exit /b 1
)

REM Check if TELEGRAM_BOT_TOKEN is set
findstr /C:"TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here" .env >nul
if %errorlevel% equ 0 (
    echo.
    echo [WARNING] Telegram Bot token is not configured!
    echo.
    echo Please update TELEGRAM_BOT_TOKEN in .env file with your actual token.
    echo See TELEGRAM-SETUP.md for instructions on how to get a token.
    echo.
    echo Press any key to continue anyway, or Ctrl+C to exit and configure...
    pause
)

echo Starting all services...
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo ========================================
echo Services started successfully!
echo ========================================
echo.
echo Services available at:
echo   - Client (Frontend): http://localhost:5173
echo   - Server (Backend):  http://localhost:3000
echo   - YouTube Service:   http://localhost:3001
echo   - PostgreSQL:        localhost:5432
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down
echo   or run stop-docker.bat
echo.
pause
