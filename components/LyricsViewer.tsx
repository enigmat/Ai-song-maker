import React from 'react';

interface LyricsViewerProps {
  lyrics: string;
  currentLineIndex: number;
}

export const LyricsViewer: React.FC<LyricsViewerProps> = ({ lyrics, currentLineIndex }) => {
  const lines = lyrics.split('\n');

  return (
    <div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 min-h-[300px] p-6 flex flex-col items-center justify-center transition-all duration-300 h-full">
        {!lyrics && (
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
            </svg>
            <p className="mt-2">Your song lyrics will appear here.</p>
          </div>
        )}
        {lyrics && (
          <div className="w-full">
            <h3 className="text-xl font-bold text-center mb-4 text-gray-200">Lyrics</h3>
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
