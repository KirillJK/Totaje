import os
import asyncio
import logging
from typing import Optional
import aiohttp
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration
TELEGRAM_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
YOUTUBE_SERVICE_URL = os.getenv('YOUTUBE_SERVICE_URL', 'http://localhost:3001')


class VideoDownloaderBot:
    """Telegram bot for downloading videos via youtube-service"""

    def __init__(self, token: str, service_url: str):
        self.token = token
        self.service_url = service_url
        self.application = Application.builder().token(token).build()

    async def start(self, update, context):
        """Handle /start command"""
        await update.message.reply_text(
            "👋 Привет! Я бот для скачивания видео и аудио.\n\n"
            "Просто отправь мне ссылку на:\n"
            "📺 YouTube видео\n"
            "📱 Instagram (посты, Reels)\n\n"
            "Я скачаю видео и отправлю тебе результат!"
        )

    async def help_command(self, update, context):
        """Handle /help command"""
        await update.message.reply_text(
            "📖 Инструкция:\n\n"
            "1. Отправь мне ссылку на видео\n"
            "2. Жди пока я скачаю\n"
            "3. Получи файл!\n\n"
            "Поддерживаются:\n"
            "• YouTube (скачивается аудио в MP3)\n"
            "• Instagram посты и Reels (скачивается видео)\n\n"
            "Команды:\n"
            "/start - Начать работу\n"
            "/help - Показать эту справку"
        )

    async def add_to_queue(self, url: str) -> Optional[dict]:
        """Add video to download queue"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f'{self.service_url}/api/videos',
                    json={'url': url}
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        error_data = await response.json()
                        logger.error(f"Failed to add video: {error_data}")
                        return None
        except Exception as e:
            logger.error(f"Error adding video to queue: {e}")
            return None

    async def get_video_status(self, video_id: str) -> Optional[dict]:
        """Get video download status"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f'{self.service_url}/api/videos/{video_id}'
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    return None
        except Exception as e:
            logger.error(f"Error getting video status: {e}")
            return None

    async def wait_for_download(self, video_id: str, max_wait: int = 300) -> Optional[dict]:
        """Wait for video download to complete"""
        waited = 0
        while waited < max_wait:
            status = await self.get_video_status(video_id)
            if not status:
                return None

            if status['status'] == 'completed':
                return status
            elif status['status'] == 'failed':
                return status

            await asyncio.sleep(5)
            waited += 5

        return None

    async def handle_url(self, update, context):
        """Handle URL messages"""
        url = update.message.text.strip()

        # Check if message contains URL
        if not ('youtube.com' in url or 'youtu.be' in url or 'instagram.com' in url):
            await update.message.reply_text(
                "❌ Пожалуйста, отправь корректную ссылку на YouTube или Instagram"
            )
            return

        # Send initial message
        status_message = await update.message.reply_text("⏳ Добавляю в очередь на скачивание...")

        # Add to queue
        result = await self.add_to_queue(url)
        if not result:
            await status_message.edit_text("❌ Не удалось добавить видео в очередь. Проверь ссылку и попробуй снова.")
            return

        video_id = result['video_id']
        await status_message.edit_text(f"✅ Добавлено в очередь!\n⬇️ Скачиваю... (ID: {video_id})")

        # Wait for download
        final_status = await self.wait_for_download(video_id, max_wait=300)

        if not final_status:
            await status_message.edit_text("⏰ Превышено время ожидания. Попробуй позже.")
            return

        if final_status['status'] == 'failed':
            error_msg = final_status.get('error_message', 'Неизвестная ошибка')
            await status_message.edit_text(f"❌ Ошибка при скачивании:\n{error_msg}")
            return

        # Download completed
        file_path = final_status.get('file_path')
        if not file_path or not os.path.exists(file_path):
            await status_message.edit_text("❌ Файл не найден на сервере")
            return

        await status_message.edit_text("📤 Отправляю файл...")

        # Send file
        try:
            # Determine if it's audio or video
            is_audio = file_path.endswith('.mp3')
            title = final_status.get('title', 'Downloaded file')

            if is_audio:
                # Send as audio
                with open(file_path, 'rb') as audio_file:
                    await update.message.reply_audio(
                        audio=audio_file,
                        title=title,
                        performer=final_status.get('channel_name', 'Unknown')
                    )
            else:
                # Send as video
                with open(file_path, 'rb') as video_file:
                    await update.message.reply_video(
                        video=video_file,
                        caption=title
                    )

            await status_message.delete()
            await update.message.reply_text("✅ Готово!")

        except Exception as e:
            logger.error(f"Error sending file: {e}")
            await status_message.edit_text(f"❌ Ошибка при отправке файла: {str(e)}")

    def run(self):
        """Start the bot"""
        # Add handlers
        self.application.add_handler(CommandHandler("start", self.start))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_url))

        # Start polling
        logger.info("Bot started!")
        self.application.run_polling()


if __name__ == '__main__':
    if not TELEGRAM_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set!")
        exit(1)

    bot = VideoDownloaderBot(TELEGRAM_TOKEN, YOUTUBE_SERVICE_URL)
    bot.run()
