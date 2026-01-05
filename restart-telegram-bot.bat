@echo off
echo ========================================
echo Restarting Telegram Bot
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if TELEGRAM_BOT_TOKEN is configured
findstr /C:"TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here" .env >nul
if %errorlevel% equ 0 (
    echo [ERROR] TELEGRAM_BOT_TOKEN is not configured in .env file!
    echo.
    echo Please update .env file with your actual Telegram Bot token.
    echo See TELEGRAM-SETUP.md for instructions.
    echo.
    pause
    exit /b 1
)

echo Restarting telegram-bot container with new environment variables...
docker-compose up -d --force-recreate telegram-bot

if errorlevel 1 (
    echo [ERROR] Failed to restart telegram-bot
    pause
    exit /b 1
)

echo.
echo ========================================
echo Telegram Bot restarted successfully!
echo ========================================
echo.
echo Checking logs (press Ctrl+C to exit)...
timeout /t 2 /nobreak >nul
docker-compose logs -f telegram-bot
