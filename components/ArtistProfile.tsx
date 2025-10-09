import React from 'react';
import { ShareButton } from './ShareButton';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadMenu } from './DownloadMenu';
import type { SingerGender, ArtistType, VocalMelody } from '../services/geminiService';
import type { SongData } from '../types';

interface ArtistProfileProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistImageUrl: string;
  lyrics: string;
  styleGuide: string;
  albumCoverPrompt: string;
  singerGender: SingerGender;
  artistType: ArtistType;
  beatPattern: string;
  vocalMelody: VocalMelody | null;
  bpm: number;
  genre: string;
  storyboard: string;
}

export const ArtistProfile: React.FC<ArtistProfileProps> = (props) => { 
  const { 
    title, artistName, artistBio, artistImageUrl, lyrics, styleGuide, 
    albumCoverPrompt, singerGender, artistType, beatPattern, vocalMelody,
    bpm, genre, storyboard
  } = props;
  
  if (!artistName) {
    return null;
  }

  const songDataForDownload: SongData = {
    title, artistName, artistBio, albumCoverPrompt, lyrics, styleGuide, 
    beatPattern, singerGender, artistType, vocalMelody, bpm, genre, storyboard
  };


  return (
    <div className="mt-8 animate-fade-in">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col md:flex-row items-center gap-6">
        <div className={`w-40 h-40 md:w-48 md:h-48 flex-shrink-0 flex items-center justify-center rounded-full border-4 border-purple-500/50 transition-colors duration-300 overflow-hidden ${!artistImageUrl ? 'bg-gray-700/50 animate-pulse' : 'bg-black'}`}>
          {!artistImageUrl ? (
             <div className="text-center text-xs text-gray-400 p-2">
                <LoadingSpinner />
                <p className="mt-2">Generating image...</p>
             </div>
          ) : (
            <img 
              key={artistImageUrl}
              src={artistImageUrl} 
              alt={`Album cover for ${title} by ${artistName}`}
              className="w-full h-full object-cover shadow-lg"
              aria-label={`Album cover for ${title} by ${artistName}`}
            />
          )}
        </div>
        <div className="text-center md:text-left flex-grow">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
            {artistName}
          </h2>
          {genre && <p className="mt-2 inline-block bg-teal-500/20 text-teal-300 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">{genre}</p>}
          <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
            <p className="text-xl text-gray-300 font-semibold">"{title}"</p>
            <ShareButton
                title={title}
                artistName={artistName}
                artistBio={artistBio}
                artistImageUrl={artistImageUrl}
                lyrics={lyrics}
                styleGuide={styleGuide}
                albumCoverPrompt={albumCoverPrompt}
                singerGender={singerGender}
                artistType={artistType}
                beatPattern={beatPattern}
                vocalMelody={vocalMelody}
                bpm={bpm}
                storyboard={storyboard}
             />
             <DownloadMenu
                songData={songDataForDownload}
                artistImageUrl={artistImageUrl}
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