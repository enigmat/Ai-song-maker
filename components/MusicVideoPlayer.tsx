import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface MusicVideoPlayerProps {
  videoUrl: string;
  isGenerating: boolean;
}

export const MusicVideoPlayer: React.FC<MusicVideoPlayerProps> = ({ videoUrl, isGenerating }) => {
  if (!isGenerating && !videoUrl) {
    return null;
  }
  
  return (
    <div className="mt-8 animate-fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">
        Music Video
      </h2>
      <div className="aspect-video bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 flex items-center justify-center overflow-hidden">
        {isGenerating && !videoUrl ? (
          <div className="text-center text-gray-400 p-4">
            <LoadingSpinner size="lg" />
            <p className="mt-4 animate-pulse">Generating your music video...</p>
            <p className="text-sm text-gray-500">This can take a few minutes.</p>
          </div>
        ) : videoUrl ? (
          <video key={videoUrl} src={videoUrl} controls className="w-full h-full object-contain" />
        ) : null}
      </div>
    </div>
  );
};
