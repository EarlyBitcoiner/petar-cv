@echo off
REM Starts a local web server so the page can fetch the data/*.json files.
REM Double-click this file, then open http://localhost:8000 in your browser.
cd /d "%~dp0"
echo.
echo   Starting server... then open  http://localhost:8000
echo   (Press Ctrl+C to stop.)
echo.
node server.js
pause
