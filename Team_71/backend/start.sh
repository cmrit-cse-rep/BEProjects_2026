#!/bin/bash
# Production start script for Render/Railway (Alternative method)
# Note: Dockerfile now uses startup.py directly, but this script is kept as backup

set -e

echo "Starting SentinelIQ Backend..."

# Run Python startup script for database initialization
echo "Running database initialization..."
python startup.py || echo "Warning: Startup script had issues, continuing anyway..."

# Start the server
echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
