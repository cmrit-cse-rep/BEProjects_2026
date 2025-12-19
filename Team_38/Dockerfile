# Use official Python image
FROM python:3.10

# Set working directory inside the container
WORKDIR /app

# Environment tweaks
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app (including your model directory, templates, static, etc.)
COPY . .

# Cloud Run will send traffic to this port
ENV PORT=8080

# Start the Flask app using gunicorn
# Increase timeout a bit because loading the DeBERTa model can take time
CMD ["gunicorn", "-b", "0.0.0.0:8080", "--timeout", "180", "app:app"]
