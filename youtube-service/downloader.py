import os
import re
import asyncio
import logging
from typing import Optional, Dict, Any
import yt_dlp

from database import Database

logger = logging.getLogger(__name__)


class YouTubeDownloader:
    """YouTube audio downloader with queue processing"""

    def __init__(self, db: Database, download_path: str):
        self.db = db
        self.download_path = download_path
        self.is_processing = False

        # Create download directory if it doesn't exist
        os.makedirs(download_path, exist_ok=True)

    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from URL (YouTube, Instagram, etc.)"""
        # Check for Instagram content (Reels, Posts, etc.)
        if self.is_instagram_reels(url):
            # Extract Instagram content ID
            instagram_patterns = [
                r'instagram\.com/reels?/([^/?#]+)',
                r'instagram\.com/p/([^/?#]+)',
            ]
            for pattern in instagram_patterns:
                match = re.search(pattern, url)
                if match:
                    return f"ig_{match.group(1)}"
            # If no pattern matches, use hash of URL
            import hashlib
            return f"ig_{hashlib.md5(url.encode()).hexdigest()[:12]}"

        # YouTube patterns
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
            r'youtube\.com\/v\/([^&\n?#]+)'
        ]

        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    def is_instagram_reels(self, url: str) -> bool:
        """Check if URL is Instagram content (Reels, Posts, etc.)"""
        return 'instagram.com' in url and ('/reel' in url or '/p/' in url or '/reels/' in url)

    async def fetch_metadata(self, url: str) -> Dict[str, Any]:
        """Fetch video metadata without downloading"""
        try:
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'skip_download': True,
            }

            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = await loop.run_in_executor(None, lambda: ydl.extract_info(url, download=False))

            return {
                'title': info.get('title'),
                'channel': info.get('uploader') or info.get('channel'),
                'duration': info.get('duration'),
                'thumbnail': info.get('thumbnail'),
            }
        except Exception as e:
            logger.error(f"Error fetching metadata: {str(e)}")
            return {}

    async def download_audio(self, video_id: str, video_url: str, title: str) -> str:
        """Download audio from YouTube video"""
        # Sanitize filename
        safe_title = re.sub(r'[<>:"/\\|?*]', '', title)[:100]
        output_template = os.path.join(self.download_path, f'{video_id}_{safe_title}.%(ext)s')

        ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_template,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',   # можно: mp3, m4a, wav, flac
            'preferredquality': '192',
        }],
        'quiet': False,
        }

        try:
            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await loop.run_in_executor(None, lambda: ydl.download([video_url]))

            # Find the downloaded file
            expected_file = os.path.join(self.download_path, f'{video_id}_{safe_title}.mp3')
            if os.path.exists(expected_file):
                return expected_file
            else:
                # Try to find any file matching the video_id
                for file in os.listdir(self.download_path):
                    if file.startswith(video_id):
                        return os.path.join(self.download_path, file)
                raise Exception("Downloaded file not found")

        except Exception as e:
            logger.error(f"Error downloading video {video_id}: {str(e)}")
            raise

    async def download_video(self, video_id: str, video_url: str, title: str) -> str:
        """Download video (for Instagram posts, Reels, TikTok, etc.)"""
        # Sanitize filename
        safe_title = re.sub(r'[<>:"/\\|?*]', '', title)[:100]
        output_template = os.path.join(self.download_path, f'{video_id}_{safe_title}.%(ext)s')

        ydl_opts = {
            'format': 'best',  # Download best quality video
            'outtmpl': output_template,
            'quiet': False,
        }

        try:
            loop = asyncio.get_event_loop()
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                await loop.run_in_executor(None, lambda: ydl.download([video_url]))

            # Find the downloaded file
            for file in os.listdir(self.download_path):
                if file.startswith(video_id):
                    return os.path.join(self.download_path, file)
            raise Exception("Downloaded file not found")

        except Exception as e:
            logger.error(f"Error downloading video {video_id}: {str(e)}")
            raise

    async def process_queue(self):
        """Background worker to process download queue"""
        logger.info("Download queue processor started")

        while True:
            try:
                # Check if there's already a download in progress
                active = await self.db.get_active_download()
                if active:
                    logger.info(f"Download in progress: {active['video_id']}")
                    await asyncio.sleep(5)
                    continue

                # Get next pending video
                next_video = await self.db.get_next_pending()
                if not next_video:
                    # No pending videos, wait before checking again
                    await asyncio.sleep(10)
                    continue

                # Start downloading
                video_id = next_video['video_id']
                video_url = next_video['video_url']
                title = next_video['title'] or 'Unknown Title'

                logger.info(f"Starting download: {video_id} - {title}")

                # Update status to downloading
                await self.db.update_status(next_video['id'], 'downloading')

                try:
                    # Check if it's Instagram content - download video instead of audio
                    if self.is_instagram_reels(video_url):
                        logger.info(f"Detected Instagram content, downloading video: {video_id}")
                        file_path = await self.download_video(video_id, video_url, title)
                    else:
                        # Download the audio for YouTube and other sources
                        file_path = await self.download_audio(video_id, video_url, title)

                    # Update status to completed
                    await self.db.update_status(
                        next_video['id'],
                        'completed',
                        file_path=file_path
                    )

                    logger.info(f"Download completed: {video_id} -> {file_path}")

                except Exception as e:
                    # Update status to failed
                    error_msg = str(e)
                    await self.db.update_status(
                        next_video['id'],
                        'failed',
                        error_message=error_msg
                    )

                    logger.error(f"Download failed: {video_id} - {error_msg}")

                # Small delay before processing next item
                await asyncio.sleep(2)

            except asyncio.CancelledError:
                logger.info("Download queue processor cancelled")
                break
            except Exception as e:
                logger.error(f"Error in queue processor: {str(e)}")
                await asyncio.sleep(10)
