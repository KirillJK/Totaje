-- Migration: Increase thumbnail_url column size to TEXT
-- Date: 2025-12-29
-- Description: Change thumbnail_url from VARCHAR(500) to TEXT to support longer URLs
--              (especially for Instagram, TikTok and other platforms with long URLs)

-- Change the column type from VARCHAR(500) to TEXT
ALTER TABLE audio_queue
ALTER COLUMN thumbnail_url TYPE TEXT;

-- Optional: Add a comment to document this change
COMMENT ON COLUMN audio_queue.thumbnail_url IS 'Thumbnail URL (TEXT type to support long URLs from various platforms)';
