FROM python:3.12-slim

WORKDIR /app

# Install ffmpeg for yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY youtube-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY youtube-service/*.py .

# Expose port
EXPOSE 8000

# Run the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
