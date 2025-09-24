import React, { useState, useEffect } from 'react';
import { ShareButton } from './ShareButton';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadButton } from './DownloadButton';
import { MasterPlayButton } from './MasterPlayButton';
import type { SingerGender, ArtistType } from '../App';
import type { VocalMelody } from '../services/geminiService';

interface ArtistProfileProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistVideoUrl: string;
  lyrics: string;
  styleGuide: string;
  artistImagePrompt: string;
  singerGender: SingerGender;
  artistType: ArtistType;
  beatPattern: string;
  vocalMelody: VocalMelody | null;
  isPlaying: boolean;
  onPlaybackToggle: () => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = ({ 
  title, artistName, artistBio, artistVideoUrl, lyrics, styleGuide, 
  artistImagePrompt, singerGender, artistType, beatPattern, vocalMelody,
  isPlaying, onPlaybackToggle, bpm, onBpmChange
}) => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    setIsVideoLoaded(false);
  }, [artistVideoUrl]);
  
  if (!artistName) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className={`w-40 h-40 md:w-48 md:h-48 flex-shrink-0 flex items-center justify-center rounded-full border-4 border-purple-500/50 transition-colors duration-300 overflow-hidden ${!artistVideoUrl ? 'bg-gray-700/50 animate-pulse' : 'bg-black'}`}>
          {!artistVideoUrl ? (
             <div className="text-center text-xs text-gray-400 p-2">
                <LoadingSpinner />
                <p className="mt-2">Generating video...</p>
             </div>
          ) : (
            <video 
              key={artistVideoUrl}
              src={artistVideoUrl} 
              onLoadedData={() => setIsVideoLoaded(true)}
              className={`w-full h-full object-cover shadow-lg transition-all duration-1000 ease-in-out ${isVideoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              autoPlay
              loop
              muted
              playsInline
              aria-label={`Video portrait of ${artistName}`}
            />
          )}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            {artistName}
          </h2>
          <div className="flex items-center justify-center md:justify-start gap-3 mt-1">
            <p className="text-xl text-gray-300 font-semibold">"{title}"</p>
            <ShareButton
                title={title}
                artistName={artistName}
                artistBio={artistBio}
                artistVideoUrl={artistVideoUrl}
                lyrics={lyrics}
                styleGuide={styleGuide}
                artistImagePrompt={artistImagePrompt}
                singerGender={singerGender}
                artistType={artistType}
                beatPattern={beatPattern}
                vocalMelody={vocalMelody}
                bpm={bpm}
             />
             <DownloadButton
                title={title}
                artistName={artistName}
                artistBio={artistBio}
                artistVideoUrl={artistVideoUrl}
                lyrics={lyrics}
                styleGuide={styleGuide}
                singerGender={singerGender}
                artistType={artistType}
                bpm={bpm}
                beatPattern={beatPattern}
                vocalMelody={vocalMelody}
             />
          </div>
          <p className="mt-4 text-gray-400 text-sm sm:text-base leading-relaxed">
            {artistBio}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <MasterPlayButton
                isPlaying={isPlaying}
                onToggle={onPlaybackToggle}
                isReady={!!vocalMelody && !!beatPattern}
            />
            <div className="flex items-center gap-3 w-full max-w-xs sm:w-auto">
                <span className="text-sm font-mono text-gray-400">BPM</span>
                <input 
                    type="range" 
                    min="60" 
                    max="180" 
                    value={bpm} 
                    onChange={(e) => onBpmChange(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    aria-label="Adjust Beats Per Minute"
                />
                <span className="text-lg font-mono bg-gray-900/50 w-14 text-center px-2 py-1 rounded-md tabular-nums">{bpm}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
