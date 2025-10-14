import React from 'react';

interface StoryboardViewerProps {
  storyboard: string;
  lyrics: string;
}

const parseStoryboardLine = (line: string, index: number) => {
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

export const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ storyboard, lyrics }) => {
  if (!storyboard && !lyrics) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          Lyrics & Storyboard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-center mb-4 text-gray-200 sticky top-0 bg-gray-900/50 py-2 z-10">Lyrics</h3>
                <div className="lyrics-container text-center font-serif text-lg leading-loose text-gray-200 w-full">
                {lyrics ? lyrics.split('\n').map((line, index) => (
                    <p
                    key={index}
                    className="transition-all duration-300 p-1 rounded-md text-gray-300"
                    >
                    {line || <>&nbsp;</>}
                    </p>
                )) : (
                    <p className="text-gray-500">No lyrics available.</p>
                )}
                </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-center mb-4 text-gray-200 sticky top-0 bg-gray-900/50 py-2 z-10">Storyboard</h3>
                <div className="whitespace-pre-wrap font-mono text-gray-300 text-left leading-relaxed text-sm sm:text-base">
                {storyboard ? storyboard.split('\n').map(parseStoryboardLine) : (
                    <p className="text-gray-500 text-center">No storyboard available.</p>
                )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
