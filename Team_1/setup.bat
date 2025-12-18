@echo off
title Eye Disease Predictor - Setup Script
echo ==========================================
echo   Eye Disease Predictor - Setup Script
echo ==========================================

echo Creating virtual environment with Python 3.11...
python -m venv venv

echo Upgrading pip...
call venv\Scripts\activate
python -m pip install --upgrade pip

echo Installing requirements...
pip install -r requirements.txt

echo.
echo ==========================================
echo   Setup Complete!
echo   To run the app:
echo   venv\Scripts\activate
echo   streamlit run app.py
echo ==========================================
pause
