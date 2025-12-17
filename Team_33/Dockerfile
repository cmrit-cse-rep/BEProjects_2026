# Use official Python runtime as base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for Selenium and Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    fonts-liberation \
    libappindicator3-1 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexif12 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxinerama1 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Download and install Chrome
RUN wget -q -O /etc/apt/trusted.gpg.d/google-chrome.gpg https://dl-ssl.google.com/linux/linux_signing_key.pub && \
    sh -c 'echo "deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' && \
    apt-get update && \
    apt-get install -y google-chrome-stable --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install ChromeDriver
RUN apt-get update && \
    apt-get install -y chromium-driver && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY server.py .
COPY scraper.py .
COPY firebase_config.py .
COPY privacy_policy_clean.txt .

# Create app user to avoid uid/gid issues
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Expose port (HuggingFace Spaces uses port 7860 by default)
EXPOSE 7860

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/tmp/huggingface/transformers
ENV HF_HOME=/tmp/huggingface
ENV TORCH_HOME=/tmp/torch
ENV TORCHINDUCTOR_CACHE_DIR=/tmp/torchinductor

# Firebase environment variables (set via Spaces secrets in production)
ENV FIREBASE_SERVICE_ACCOUNT_FILE=${FIREBASE_SERVICE_ACCOUNT_FILE:-serviceAccountKey.json}
ENV FIREBASE_DATABASE_URL=${FIREBASE_DATABASE_URL:-https://your-project.firebaseio.com}
ENV FIREBASE_API_KEY=${FIREBASE_API_KEY:-YOUR_API_KEY_HERE}
ENV FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN:-your-project.firebaseapp.com}
ENV FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-your-project-id}
ENV FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET:-your-project.appspot.com}
ENV FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID:-1234567890}
ENV FIREBASE_APP_ID=${FIREBASE_APP_ID:-1:1234567890:web:abcdef1234567890}

# Pre-create cache directories with proper permissions
RUN mkdir -p /tmp/huggingface/transformers /tmp/torch /tmp/torchinductor && chmod -R 777 /tmp/huggingface /tmp/torch /tmp/torchinductor

# Switch to app user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:7860/ || exit 1

# Run the application
CMD ["python", "server.py"]
