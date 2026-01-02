import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface QueueItem {
  id: number;
  video_url: string;
  video_id: string;
  title: string | null;
  channel_name: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  status: string;
  file_path: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const Queue: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/queue', {
        withCredentials: false,
      });
      setQueue(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      setError('Failed to fetch queue');
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim()) return;

    setAddingVideo(true);
    setError(null);

    try {
      await axios.post('http://localhost:3001/api/videos', {
        url: newVideoUrl,
      });
      setNewVideoUrl('');
      fetchQueue();
    } catch (error: any) {
      console.error('Failed to add video:', error);
      setError(error.response?.data?.detail || 'Failed to add video');
    } finally {
      setAddingVideo(false);
    }
  };

  const isInstagramReels = (url: string): boolean => {
    return url.includes('instagram.com') && (url.includes('/reel') || url.includes('/p/') || url.includes('/reels/'));
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'Unknown';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      downloading: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    const statusIcons: Record<string, string> = {
      pending: '⏳',
      downloading: '⬇️',
      completed: '✅',
      failed: '❌',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        <span className="mr-1">{statusIcons[status] || '📄'}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading queue...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Audio Download Queue</h1>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Video</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !addingVideo && addVideo()}
            placeholder="Enter YouTube or Instagram URL..."
            className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
            disabled={addingVideo}
          />
          <button
            onClick={addVideo}
            disabled={addingVideo || !newVideoUrl.trim()}
            className="px-4 md:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base whitespace-nowrap disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {addingVideo ? 'Adding...' : 'Add to Queue'}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Queue ({queue.length})</h2>

        {queue.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No videos in queue. Add one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="mb-3 w-1/2 aspect-video bg-gray-100 rounded overflow-hidden">
                  {isInstagramReels(item.video_url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600">
                      <svg className="w-12 h-12 text-white mb-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.823 1l2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 011.596 2.82l.07.295h-4.629L15.15 1zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 013.942-4.53zm9.735 12.834l-4.545-2.624a.909.909 0 00-1.356.668l-.008.12v5.248a.91.91 0 001.255.84l.109-.053 4.545-2.624a.909.909 0 00.1-1.507l-.1-.068-4.545-2.624-4.545 2.624zm-11.954-9.09h7.66l-.67 1.393h-6.372a6.03 6.03 0 00-.618-1.393zm.019 1.916h6.133L8.11 8.943h-5.43a6.007 6.007 0 00.166-1.906zm7.142 1.914l-.67 1.393h-5.64a6.031 6.031 0 00-.376-1.393zm.022 1.916l-.67 1.394H5.86a6.031 6.031 0 00-.117-1.394h4.31zm-.065 1.916l-.67 1.393H4.307a6.012 6.012 0 00.246-1.393zm-5.012 1.916h3.84l-.67 1.394H2.26a6.012 6.012 0 00.783-1.394zm10.334 1.916a5.963 5.963 0 01-5.94 5.937 5.96 5.96 0 01-5.94-5.937h11.88z"/>
                      </svg>
                      <span className="text-white text-lg font-bold tracking-wider">REELS</span>
                    </div>
                  ) : item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title || 'Video thumbnail'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : null}
                </div>

                <div className="mb-2">
                  {getStatusBadge(item.status)}
                </div>

                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {item.title || 'Loading...'}
                </h3>

                {item.channel_name && (
                  <p className="text-sm text-gray-600 mb-2">
                    📺 {item.channel_name}
                  </p>
                )}

                {item.duration && (
                  <p className="text-sm text-gray-600 mb-2">
                    ⏱️ {formatDuration(item.duration)}
                  </p>
                )}

                {item.error_message && (
                  <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded">
                    {item.error_message}
                  </p>
                )}

                {item.status === 'completed' && item.file_path && (
                  <p className="text-xs text-gray-500 mt-2 truncate" title={item.file_path}>
                    📁 {item.file_path.split('/').pop()}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  <p>Added: {new Date(item.created_at).toLocaleString()}</p>
                  {item.completed_at && (
                    <p>Completed: {new Date(item.completed_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Queue;
