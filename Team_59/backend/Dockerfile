# backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# STEP A: Install the heavy ML stuff FIRST
# We install these separately to manage memory better
RUN pip install --no-cache-dir \
    "psycopg2-binary>=2.9" \
    "torch>=2.0.0" \
    "torchvision>=0.15.0" \
    --extra-index-url https://download.pytorch.org/whl/cpu

# STEP B: Install the rest from requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY trained_models/ ./trained_models/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]