@echo off
echo ========================================
echo Stopping JKTota Services
echo ========================================
echo.

docker-compose down

if errorlevel 1 (
    echo [ERROR] Failed to stop services
    pause
    exit /b 1
)

echo.
echo ========================================
echo All services stopped successfully!
echo ========================================
echo.
pause
