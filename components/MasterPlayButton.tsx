import React from 'react';

const PlayIcon = () => (
  <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

interface MasterPlayButtonProps {
  isPlaying: boolean;
  onToggle: () => void;
  isReady: boolean;
}

export const MasterPlayButton: React.FC<MasterPlayButtonProps> = ({ isPlaying, onToggle, isReady }) => {
  return (
    <button
        onClick={onToggle}
        disabled={!isReady}
        className="inline-flex items-center justify-center gap-3 text-lg font-semibold px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        aria-label={isPlaying ? 'Pause song' : 'Play song'}
        title={!isReady ? 'Song is not ready for playback' : (isPlaying ? 'Pause song' : 'Play song')}
    >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
        <span>{isPlaying ? 'Pause' : 'Play Song'}</span>
    </button>
  );
};
