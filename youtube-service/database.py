import asyncpg
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class Database:
    """Database management class for audio queue"""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            raise

    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def add_video(
        self,
        video_url: str,
        video_id: str,
        title: Optional[str] = None,
        channel_name: Optional[str] = None,
        duration: Optional[int] = None,
        thumbnail_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add a new video to the queue"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO audio_queue
                (video_url, video_id, title, channel_name, duration, thumbnail_url, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                RETURNING id, video_id, status, created_at
                """,
                video_url, video_id, title, channel_name, duration, thumbnail_url
            )
            return dict(row)

    async def get_video_by_video_id(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get video by YouTube video ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM audio_queue WHERE video_id = $1",
                video_id
            )
            return dict(row) if row else None

    async def get_video_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        """Get video by database ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM audio_queue WHERE id = $1",
                id
            )
            return dict(row) if row else None

    async def get_queue(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all videos in queue, ordered by creation time"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM audio_queue
                ORDER BY
                    CASE
                        WHEN status = 'downloading' THEN 1
                        WHEN status = 'pending' THEN 2
                        WHEN status = 'completed' THEN 3
                        ELSE 4
                    END,
                    created_at ASC
                LIMIT $1
                """,
                limit
            )
            return [dict(row) for row in rows]

    async def get_next_pending(self) -> Optional[Dict[str, Any]]:
        """Get the next pending video in queue"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM audio_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
                """
            )
            return dict(row) if row else None

    async def update_status(
        self,
        id: int,
        status: str,
        file_path: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Update video status"""
        async with self.pool.acquire() as conn:
            if status == 'downloading':
                await conn.execute(
                    """
                    UPDATE audio_queue
                    SET status = $1, started_at = $2
                    WHERE id = $3
                    """,
                    status, datetime.utcnow(), id
                )
            elif status == 'completed':
                await conn.execute(
                    """
                    UPDATE audio_queue
                    SET status = $1, file_path = $2, completed_at = $3
                    WHERE id = $4
                    """,
                    status, file_path, datetime.utcnow(), id
                )
            elif status == 'failed':
                await conn.execute(
                    """
                    UPDATE audio_queue
                    SET status = $1, error_message = $2
                    WHERE id = $3
                    """,
                    status, error_message, id
                )
            else:
                await conn.execute(
                    "UPDATE audio_queue SET status = $1 WHERE id = $2",
                    status, id
                )

    async def get_active_download(self) -> Optional[Dict[str, Any]]:
        """Get currently downloading video"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM audio_queue WHERE status = 'downloading' LIMIT 1"
            )
            return dict(row) if row else None
