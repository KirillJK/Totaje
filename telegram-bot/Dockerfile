FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY telegram-bot/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY telegram-bot/bot.py .

# Run the bot
CMD ["python", "bot.py"]
