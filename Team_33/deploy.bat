@echo off
REM HuggingFace Spaces Deployment Script for Windows
REM Run this to prepare your files for deployment

setlocal enabledelayedexpansion

echo.
echo ================================
echo Privacy Policy API - Deployment Prep
echo ================================
echo.

REM Check if required files exist
echo Checking required files...
set "required_files=server.py scraper.py privacy_policy_clean.txt requirements.txt Dockerfile"

for %%F in (%required_files%) do (
    if not exist "%%F" (
        echo X Missing: %%F
        exit /b 1
    ) else (
        echo   ^✓ %%F
    )
)

echo.
echo ^✓ All required files present
echo.

REM Check Python version
echo Checking Python version...
for /f "tokens=*" %%I in ('python --version 2^>^&1') do set "python_version=%%I"
echo   Python: %python_version%
echo.

REM Check if build argument provided
if "%1"=="build" (
    echo.
    echo Compiling Docker image...
    docker build -t privacy-policy-api:latest .
    if %ERRORLEVEL% EQU 0 (
        echo ^✓ Build complete
        echo.
        echo To test locally, run:
        echo   docker-compose up
    ) else (
        echo X Build failed
        exit /b 1
    )
    exit /b 0
)

REM Display deployment instructions
echo.
echo Deployment Instructions:
echo.
echo 1. Create a new Space on HuggingFace:
echo    - Go to https://huggingface.co/spaces
echo    - Click 'Create new Space'
echo    - Select 'Docker' as SDK
echo    - Name your space 'privacy-policy-api'
echo.
echo 2. Clone the Space repository:
echo    git clone https://huggingface.co/spaces/YOUR_USERNAME/privacy-policy-api
echo    cd privacy-policy-api
echo.
echo 3. Copy your files:
echo    copy Dockerfile .
echo    copy server.py .
echo    copy scraper.py .
echo    copy requirements.txt .
echo    copy privacy_policy_clean.txt .
echo.
echo 4. Commit and push:
echo    git add .
echo    git commit -m "Add Privacy Policy API"
echo    git push
echo.
echo 5. Monitor deployment:
echo    - Check the 'Logs' tab in your Space
echo    - Wait for the build to complete (5-10 minutes)
echo.
echo ================================
echo Files ready for deployment! ^✓
echo ================================
echo.
