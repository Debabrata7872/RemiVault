@echo off
echo ========================================================
echo Starting RemiVault (Backend ^& Frontend for PC + Mobile)
echo ========================================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set IP=%%a
    goto :found_ip
)

:found_ip
set IP=%IP: =%
echo Local IP Address detected: %IP%
echo.
echo Phone URL:    http://%IP%:5173
echo PC Local URL: http://localhost:5173
echo Backend API:  http://%IP%:8000/api/health
echo.
echo Starting Laravel backend on 0.0.0.0:8000...
start "RemiVault - Laravel Backend" cmd /k "cd /d %~dp0backend && php artisan serve --host=0.0.0.0 --port=8000"

echo Starting Vite frontend on 0.0.0.0:5173...
start "RemiVault - Vite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both services launched in separate windows!
echo Make sure your phone is connected to the same Wi-Fi / Local Network.
echo Open http://%IP%:5173 in your phone's browser.
echo ========================================================
pause
