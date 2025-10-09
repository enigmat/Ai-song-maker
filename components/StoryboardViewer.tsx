import React from 'react';

interface StoryboardViewerProps {
  storyboard: string;
}

const parseLine = (line: string, index: number) => {
    line = line.trim();
    if (line.toUpperCase().startsWith('SCENE') || line.toUpperCase().startsWith('INT.') || line.toUpperCase().startsWith('EXT.')) {
        return <p key={index} className="font-bold text-teal-400 mt-4 uppercase">{line}</p>;
    }
    if (line.includes('SHOT:') || /^[A-Z\s]+$/.test(line)) { // Heuristic for camera shots (all caps)
        return <p key={index} className="font-bold text-purple-400">{line}</p>;
    }
    if (line.startsWith('(') && line.endsWith(')')) {
        return <p key={index} className="italic text-gray-400">{line}</p>;
    }
    return <p key={index}>{line || <>&nbsp;</>}</p>;
};

export const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ storyboard }) => {
  if (!storyboard) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          Cinematic Storyboard
        </h2>
        <div className="whitespace-pre-wrap font-mono text-gray-300 text-left leading-relaxed text-sm sm:text-base max-h-[60vh] overflow-y-auto p-4 bg-gray-900/50 rounded-lg">
          {storyboard.split('\n').map(parseLine)}
        </div>
      </div>
    </div>
  );
};