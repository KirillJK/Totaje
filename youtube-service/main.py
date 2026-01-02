import os
import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
import uvicorn

from database import Database
from downloader import YouTubeDownloader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube Audio Download Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db: Optional[Database] = None
downloader: Optional[YouTubeDownloader] = None
download_task: Optional[asyncio.Task] = None


class VideoRequest(BaseModel):
    url: HttpUrl


class VideoResponse(BaseModel):
    id: int
    video_id: str
    status: str
    message: str


class QueueItem(BaseModel):
    id: int
    video_url: str
    video_id: str
    title: Optional[str]
    channel_name: Optional[str]
    duration: Optional[int]
    thumbnail_url: Optional[str]
    status: str
    file_path: Optional[str]
    error_message: Optional[str]
    created_at: str
    started_at: Optional[str]
    completed_at: Optional[str]


@app.on_event("startup")
async def startup_event():
    global db, downloader, download_task

    database_url = os.getenv("DATABASE_URL", "postgresql://jktota:jktota123@localhost:5432/jktota_db")
    download_path = os.getenv("DOWNLOAD_PATH", "./downloads")

    logger.info(f"Connecting to database: {database_url}")
    db = Database(database_url)
    await db.connect()

    logger.info(f"Initializing downloader with path: {download_path}")
    downloader = YouTubeDownloader(db, download_path)

    download_task = asyncio.create_task(downloader.process_queue())
    logger.info("Download worker started")


@app.on_event("shutdown")
async def shutdown_event():
    global db, download_task

    if download_task:
        download_task.cancel()
        try:
            await download_task
        except asyncio.CancelledError:
            pass

    if db:
        await db.disconnect()

    logger.info("Service shutdown complete")


@app.get("/")
async def root():
    return {
        "service": "YouTube Audio Download Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.post("/api/videos", response_model=VideoResponse)
async def add_video(request: VideoRequest):
    if not db or not downloader:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        video_id = downloader.extract_video_id(str(request.url))
        if not video_id:
            raise HTTPException(status_code=400, detail="Invalid URL. Please provide a valid YouTube or Instagram URL")

        existing = await db.get_video_by_video_id(video_id)
        if existing:
            await db.update_status(existing['id'], 'pending', error_message=None)
            logger.info(f"Re-queued existing video: {video_id}")
            return VideoResponse(
                id=existing['id'],
                video_id=existing['video_id'],
                status='pending',
                message="Video re-added to download queue"
            )

        # Fetch video metadata
        metadata = await downloader.fetch_metadata(str(request.url))

        # Add to database
        video_record = await db.add_video(
            video_url=str(request.url),
            video_id=video_id,
            title=metadata.get('title'),
            channel_name=metadata.get('channel'),
            duration=metadata.get('duration'),
            thumbnail_url=metadata.get('thumbnail')
        )

        logger.info(f"Added video to queue: {video_id} - {metadata.get('title')}")

        return VideoResponse(
            id=video_record['id'],
            video_id=video_record['video_id'],
            status=video_record['status'],
            message="Video added to download queue"
        )

    except Exception as e:
        logger.error(f"Error adding video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add video: {str(e)}")


@app.get("/api/queue", response_model=List[QueueItem])
async def get_queue():
    """Get the current download queue"""
    if not db:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        queue = await db.get_queue()
        return [
            QueueItem(
                id=item['id'],
                video_url=item['video_url'],
                video_id=item['video_id'],
                title=item['title'],
                channel_name=item['channel_name'],
                duration=item['duration'],
                thumbnail_url=item['thumbnail_url'],
                status=item['status'],
                file_path=item['file_path'],
                error_message=item['error_message'],
                created_at=item['created_at'].isoformat() if item['created_at'] else None,
                started_at=item['started_at'].isoformat() if item['started_at'] else None,
                completed_at=item['completed_at'].isoformat() if item['completed_at'] else None
            )
            for item in queue
        ]
    except Exception as e:
        logger.error(f"Error fetching queue: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch queue: {str(e)}")


@app.get("/api/videos/{video_id}")
async def get_video(video_id: str):
    """Get status of a specific video"""
    if not db:
        raise HTTPException(status_code=503, detail="Service not initialized")

    try:
        video = await db.get_video_by_video_id(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")

        return QueueItem(
            id=video['id'],
            video_url=video['video_url'],
            video_id=video['video_id'],
            title=video['title'],
            channel_name=video['channel_name'],
            duration=video['duration'],
            thumbnail_url=video['thumbnail_url'],
            status=video['status'],
            file_path=video['file_path'],
            error_message=video['error_message'],
            created_at=video['created_at'].isoformat() if video['created_at'] else None,
            started_at=video['started_at'].isoformat() if video['started_at'] else None,
            completed_at=video['completed_at'].isoformat() if video['completed_at'] else None
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch video: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    uvicorn.run(app, host="0.0.0.0", port=port)
