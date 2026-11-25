@echo off
cd /d %~dp0

set GOBIN=C:\Program Files\Go\bin

echo Killing old processes on port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 1 /nobreak >nul

echo Building server...
"%GOBIN%\go" build -o server.exe ./cmd/server
if errorlevel 1 (
    echo Build failed! Press Enter to exit...
    pause >nul
    exit /b 1
)

echo Starting server...
start /b cmd /c "server.exe"
timeout /t 3 /nobreak >nul

start http://localhost:8080

echo Server started at http://localhost:8080
echo Press Enter to exit...
pause >nul