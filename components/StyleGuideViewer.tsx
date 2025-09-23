import React from 'react';

interface StyleGuideViewerProps {
  styleGuide: string;
  isLoading: boolean;
}

export const StyleGuideViewer: React.FC<StyleGuideViewerProps> = ({ styleGuide, isLoading }) => {
  if (!styleGuide || isLoading) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
          Production Style Guide
        </h2>
        <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base">
          {styleGuide}
        </pre>
      </div>
    </div>
  );
};

// Add fade-in animation keyframes to a global style sheet if possible.
// For now, we rely on a conceptual animation.
// A simple keyframe for this might look like:
/*
@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
}
*/
