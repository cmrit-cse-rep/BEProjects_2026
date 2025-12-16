# Dockerfile — use a stable Python 3.10 base to match your requirements
FROM python:3.10-slim

# Install system deps required for Pillow / OpenCV builds and common libs
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create working dir
WORKDIR /app

# Copy requirements first for better cache use
COPY requirements.txt /app/requirements.txt

# Upgrade pip and install python deps (prefer binary wheels)
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --prefer-binary -r requirements.txt

# Copy app files
COPY . /app

# Expose port expected by Render
EXPOSE 5000

# Environment defaults
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1
ENV USE_CAMERA=false

# Start command (gunicorn)
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5000", "--workers", "1", "--log-file", "-"]
