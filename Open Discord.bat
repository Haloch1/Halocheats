@echo off
setlocal
set "DISCORD_DIR=%LOCALAPPDATA%\Discord"

rem Launch the installed Discord app directly (works even if the updater is busy).
for /f "delims=" %%D in ('dir /b /ad /o-n "%DISCORD_DIR%\app-*" 2^>nul') do (
    start "" "%DISCORD_DIR%\%%D\Discord.exe"
    exit /b
)

rem Fallback for installations that do not expose an app-version folder yet.
start "" "%DISCORD_DIR%\Update.exe" --processStart Discord.exe
