FROM python:3.10-slim

# Install system dependencies needed for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the necessary files for deployment
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY templates ./templates
COPY static ./static
COPY cnnbigru_model.pth .

EXPOSE 5000

CMD ["python", "app.py"]
