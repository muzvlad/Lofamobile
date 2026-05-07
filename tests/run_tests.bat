@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
set "PROJECT_DIR=C:\Users\Muzika\Documents\Projects\LofaMobile"
cd /d "%PROJECT_DIR%"

echo ========================================
echo   Набор тестов - ЛОФА - mobile
echo ========================================
echo.

set PASSED=0
set FAILED=0
set TOTAL=0

echo [1] Тестирование internal/db...
echo ----------------------------------------
go test ./internal/db/... -v -coverprofile=tests\db_coverage.out
if errorlevel 1 (
    set /a FAILED+=1
    echo [❌] тесты db
) else (
    set /a PASSED+=1
    echo [✅] тесты db
)
set /a TOTAL+=1
echo.

echo [2] Тестирование internal/api...
echo ----------------------------------------
go test ./internal/api/... -v -coverprofile=tests\api_coverage.out
if errorlevel 1 (
    set /a FAILED+=1
    echo [❌] тесты api
) else (
    set /a PASSED+=1
    echo [✅] тесты api
)
set /a TOTAL+=1
echo.

echo [3] Тестирование internal/ws...
echo ----------------------------------------
go test ./internal/ws/... -v -coverprofile=tests\ws_coverage.out
if errorlevel 1 (
    set /a FAILED+=1
    echo [❌] тесты ws
) else (
    set /a PASSED+=1
    echo [✅] тесты ws
)
set /a TOTAL+=1
echo.

echo [4] Тестирование локализации...
echo ----------------------------------------
node tests\localization_test.js
if errorlevel 1 (
    set /a FAILED+=1
    echo [❌] тесты локализации
) else (
    set /a PASSED+=1
    echo [✅] тесты локализации
)
set /a TOTAL+=1
echo.

echo ========================================
echo   Отчёт о покрытии кода
echo ========================================
echo.

if exist tests\db_coverage.out (
    echo Покрытие DB:
    go tool cover -func=tests\db_coverage.out
    echo.
)

if exist tests\api_coverage.out (
    echo Покрытие API:
    go tool cover -func=tests\api_coverage.out
    echo.
)

if exist tests\ws_coverage.out (
    echo Покрытие WS:
    go tool cover -func=tests\ws_coverage.out
    echo.
)

echo ========================================
echo   Результат: !PASSED!/!TOTAL! успешно, !FAILED! с ошибками
echo ========================================
echo.

pause

endlocal