@echo off
echo.
echo   halo! ini script buat install cert ke windows
echo   biar luci/gt ga nolak koneksi https kita
echo.
echo   pastiin kamu run as administrator ya!!
echo.

certutil -addstore -f "ROOT" "%~dp0certs\cert.pem"

if %errorlevel% equ 0 (
    echo.
    echo   done! cert udah ke-install
    echo   restart browser/growtopia kalo perlu
) else (
    echo.
    echo   gagal, coba klik kanan - run as administrator
)
echo.
pause
