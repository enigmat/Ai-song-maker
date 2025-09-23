import React, { useState, useEffect } from 'react';
import { ShareButton } from './ShareButton';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadButton } from './DownloadButton';

interface ArtistProfileProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistImageUrl: string;
  lyrics: string;
  styleGuide: string;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ title, artistName, artistBio, artistImageUrl, lyrics, styleGuide }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [artistImageUrl]);
  
  if (!artistName) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className={`w-40 h-40 md:w-48 md:h-48 flex-shrink-0 flex items-center justify-center rounded-full border-4 border-purple-500/50 transition-colors duration-300 ${!artistImageUrl ? 'bg-gray-700/50 animate-pulse' : 'bg-transparent'}`}>
          {!artistImageUrl ? (
             <LoadingSpinner />
          ) : (
            <img 
              src={artistImageUrl} 
              alt={`Portrait of ${artistName}`}
              onLoad={() => setIsImageLoaded(true)}
              className={`w-full h-full rounded-full object-cover shadow-lg transition-all duration-1000 ease-in-out ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            />
          )}
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            {artistName}
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
            <p className="text-xl text-gray-300 font-semibold">"{title}"</p>
            <ShareButton
                title={title}
                artistName={artistName}
                artistBio={artistBio}
                artistImageUrl={artistImageUrl}
                lyrics={lyrics}
                styleGuide={styleGuide}
             />
             <DownloadButton
                title={title}
                artistName={artistName}
                artistBio={artistBio}
                artistImageUrl={artistImageUrl}
                lyrics={lyrics}
                styleGuide={styleGuide}
             />
          </div>
          <p className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed">
            {artistBio}
          </p>
        </div>
      </div>
    </div>
  );
};

// Add fade-in animation keyframes to a global style sheet if possible.
/*
@keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
}
*/