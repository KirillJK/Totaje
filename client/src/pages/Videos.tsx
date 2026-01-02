import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Video {
  name: string;
  path: string;
}

const Videos: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/videos', {
        withCredentials: true,
      });
      setVideos(response.data);
      if (response.data.length > 0) {
        setCurrentVideo(response.data[0].path);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Loading videos...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Videos</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            {currentVideo ? (
              <div>
                <video
                  key={currentVideo}
                  controls
                  className="w-full rounded-lg"
                  style={{ maxHeight: '70vh' }}
                >
                  <source
                    src={`http://localhost:3000/api/videos/stream/${encodeURIComponent(currentVideo)}`}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
                <div className="mt-4">
                  <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                    {currentVideo}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">Select a video to play</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">Video List</h2>
            {videos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No videos found</p>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {videos.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentVideo(video.path)}
                    className={`w-full text-left p-3 rounded-lg transition-colors text-sm md:text-base ${
                      currentVideo === video.path
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8 5v10l7-5-7-5z" />
                      </svg>
                      <span className="truncate">{video.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Videos;
