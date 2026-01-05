@echo off
echo ========================================
echo Building Docker Containers for JKTota
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Building Server container...
docker build -t jktota-server:latest -f server/Dockerfile .
if errorlevel 1 (
    echo [ERROR] Failed to build server container
    pause
    exit /b 1
)
echo [SUCCESS] Server container built
echo.

echo [2/5] Building Client container...
docker build -t jktota-client:latest client/
if errorlevel 1 (
    echo [ERROR] Failed to build client container
    pause
    exit /b 1
)
echo [SUCCESS] Client container built
echo.

echo [3/5] Building YouTube Service container...
docker build -t jktota-youtube-service:latest youtube-service/
if errorlevel 1 (
    echo [ERROR] Failed to build youtube-service container
    pause
    exit /b 1
)
echo [SUCCESS] YouTube Service container built
echo.

echo [4/5] Building Telegram Bot container...
docker build -t jktota-telegram-bot:latest telegram-bot/
if errorlevel 1 (
    echo [ERROR] Failed to build telegram-bot container
    pause
    exit /b 1
)
echo [SUCCESS] Telegram Bot container built
echo.

echo [5/5] Pulling PostgreSQL image...
docker pull postgres:15-alpine
if errorlevel 1 (
    echo [ERROR] Failed to pull postgres image
    pause
    exit /b 1
)
echo [SUCCESS] PostgreSQL image pulled
echo.

echo ========================================
echo All containers built successfully!
echo ========================================
echo.
echo To start all services, run:
echo   docker-compose up -d
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop all services:
echo   docker-compose down
echo.
pause
