@echo off
echo Starting Flask Emotion Analysis Service...
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask app...
python start_flask.py

pause 