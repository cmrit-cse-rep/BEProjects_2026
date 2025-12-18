@echo off
echo ==========================================
echo   Launching Eye Disease Predictor
echo ==========================================

:: Activate virtual environment
call venv\Scripts\activate

:: Run Streamlit app
streamlit run app.py

:: Keep window open if Streamlit exits
pause
