@echo off
REM Setup script for YouTube Playlist Downloader - Windows
REM Run this in PowerShell or Command Prompt as Administrator

echo 🎬 YouTube Playlist Downloader - Setup
echo ======================================

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

for /f "tokens=2 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 18 (
    echo Error: Node.js 18+ required (found v%NODE_MAJOR%)
    exit /b 1
)

echo ✓ Node.js %NODE_VERSION% found

REM Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python 3 is not installed
    echo Please install Python 3.8+ from https://python.org/
    exit /b 1
)

for /f "tokens=2 delims=. " %%a in ('python -c "import sys; print(sys.version_info.major)"') do set PY_MAJOR=%%a
for /f "tokens=2 delims=. " %%a in ('python -c "import sys; print(sys.version_info.minor)"') do set PY_MINOR=%%a
echo ✓ Python %PY_MAJOR%.%PY_MINOR% found

REM Check for pip
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo Warning: pip not found, trying python -m pip
    set PIP_CMD=python -m pip
) else (
    set PIP_CMD=pip
)

echo.
echo 📦 Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: npm install failed
    exit /b 1
)

echo.
echo 🐍 Setting up Python environment...
cd python

REM Create virtual environment
if not exist venv (
    python -m venv venv
    echo ✓ Virtual environment created
)

REM Activate and install
call venv\Scripts\activate
%PIP_CMD% install --upgrade pip
%PIP_CMD% install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Python dependencies installation failed
    exit /b 1
)

echo ✓ Python dependencies installed

REM Verify yt-dlp
venv\Scripts\yt-dlp.exe --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: yt-dlp installation failed
    exit /b 1
)

for /f "delims=" %%a in ('venv\Scripts\yt-dlp.exe --version') do set YTDLP_VERSION=%%a
echo ✓ yt-dlp %YTDLP_VERSION% installed

cd ..

echo.
echo 🔨 Building frontend...
npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    exit /b 1
)

echo.
echo ======================================
echo ✅ Setup complete!
echo ======================================
echo.
echo To start the app:
echo   npm start
echo.
echo To run in development mode:
echo   npm run dev
echo.
echo To run API server only:
echo   npm run api
echo.
echo API will be available at: http://localhost:3001/api
echo WebSocket at: ws://localhost:3001

pause