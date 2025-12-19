# Backend Dockerfile for FastAPI
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory (models should be in repo or mounted)
RUN mkdir -p /app/models

# Make start script executable
RUN chmod +x start.sh || true

# Expose port (Render uses PORT env var)
EXPOSE 8000

# Run startup script then start the server
# This ensures database is initialized automatically
# Use PORT env var if available (Railway), otherwise default to 8000
CMD python startup.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}