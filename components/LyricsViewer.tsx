import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LyricsViewerProps {
  lyrics: string;
  isLoading: boolean;
  isPlaying: boolean;
  currentLineIndex: number;
  onPlayToggle: () => void;
  isPlayable: boolean;
}

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);


export const LyricsViewer: React.FC<LyricsViewerProps> = ({ lyrics, isLoading, isPlaying, currentLineIndex, onPlayToggle, isPlayable }) => {
  const lines = lyrics.split('\n');

  return (
    <div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 min-h-[300px] p-6 flex flex-col items-center justify-center transition-all duration-300 h-full">
        {isLoading && (
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400">Crafting your masterpiece...</p>
          </div>
        )}
        {!isLoading && !lyrics && (
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
            </svg>
            <p className="mt-2">Your song lyrics will appear here.</p>
          </div>
        )}
        {!isLoading && lyrics && (
          <div className="w-full">
            <div className="flex justify-center mb-6">
                <button 
                  onClick={onPlayToggle} 
                  className="text-purple-400 hover:text-white transition-colors duration-300 transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!lyrics || !isPlayable}
                  aria-label={isPlaying ? 'Pause song' : 'Play song'}
                  title={!isPlayable ? 'Speech synthesis not available in this browser' : (isPlaying ? 'Pause song' : 'Play song')}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
            </div>
            <div className="lyrics-container max-h-[50vh] overflow-y-auto text-center font-serif text-lg leading-loose text-gray-200 w-full">
              {lines.map((line, index) => (
                <p
                  key={index}
                  className={`transition-all duration-300 p-1 rounded-md ${currentLineIndex === index ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105' : 'text-gray-300'}`}
                >
                  {line || <>&nbsp;</>}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};