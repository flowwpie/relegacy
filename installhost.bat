@echo off
setlocal EnableDelayedExpansion

TITLE Change Hosts Bruh
echo ======== Relegacy hosts localhost ========
echo.
echo INFO: Disable your Anti Virus if it blocks the hosts file from being changed.
echo.
echo.

:: Ensure admin privileges (we require them for updating the host entries)
>nul 2>&1 "%SystemRoot%\system32\cacls.exe" "%SystemRoot%\system32\config\system"
if %errorlevel% NEQ 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

set "HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts"
set "TEMP_FILE=%TEMP%\hosts_tmp.txt"

:: ==== MAIN LOGIC STARTS HERE ====

set "IP1=127.0.0.1"

echo.
set /p DO_INSTALL=Do you want to install Relegacy hosts entries? (Y/N): 
if /I "%DO_INSTALL%"=="Y" (
    call :remove_growtopia

    echo.
    if not defined IP1 (
        echo Failed to resolve 
        timeout /t 5 /nobreak >nul
        exit /b
    )

    set lines[0]=%IP1% login.growtopiagame.com

    echo.
    echo Adding new entries...
    for /L %%i in (0,1,7) do (
        findstr /C:"!lines[%%i]!" "%HOSTS_FILE%" >nul || (
            echo !lines[%%i]!>> "%HOSTS_FILE%"
            echo Added: !lines[%%i]!
        )
    )

    echo.
    echo Flushing DNS cache...
    ipconfig /flushdns
    echo.
    pause
    exit /b
)

:: If not installing, ask to uninstall
set /p DO_UNINSTALL=Do you want to uninstall Relegacy hosts entries? (Y/N): 
if /I "%DO_UNINSTALL%"=="Y" (
    call :remove_growtopia
    echo.
    echo Flushing DNS cache...
    ipconfig /flushdns
    echo.
    echo Uninstall complete.
    pause
    exit /b
)

echo.
echo No changes made.
pause
exit /b

:: ==== FUNCTION DEFINITION AT THE BOTTOM ====
:remove_growtopia
echo Clearing Host entries...
break > "%TEMP_FILE%"
for /f "usebackq delims=" %%A in ("%HOSTS_FILE%") do (
    echo %%A | findstr /I "growtopia" >nul
    if errorlevel 1 (
        echo %%A | findstr /I "rtsoft" >nul
        if errorlevel 1 (
            echo %%A | findstr /I "hamumu" >nul
            if errorlevel 1 (
                echo %%A>> "%TEMP_FILE%"
            )
        )
    )
)

copy /Y "%TEMP_FILE%" "%HOSTS_FILE%" >nul
del "%TEMP_FILE%"
echo Done!
goto :eof