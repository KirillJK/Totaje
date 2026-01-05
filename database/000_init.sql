-- Initialize database schema for YouTube audio download queue

CREATE TABLE IF NOT EXISTS audio_queue (
    id SERIAL PRIMARY KEY,
    video_url VARCHAR(500) NOT NULL,
    video_id VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(500),
    channel_name VARCHAR(200),
    duration INTEGER, -- Duration in seconds
    thumbnail_url TEXT, -- Changed to TEXT to support long URLs from various platforms
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    file_path VARCHAR(1000),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for efficient queue queries
CREATE INDEX idx_audio_queue_status ON audio_queue(status);

-- Create index on created_at for ordering
CREATE INDEX idx_audio_queue_created_at ON audio_queue(created_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_audio_queue_updated_at
    BEFORE UPDATE ON audio_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO audio_queue (video_url, video_id, title, channel_name, duration, status)
-- VALUES
--     ('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ', 'Sample Video', 'Sample Channel', 213, 'pending');
