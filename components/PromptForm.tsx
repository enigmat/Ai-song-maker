import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { SingerGender, ArtistType } from '../App';

interface PromptFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  singerGender: SingerGender;
  setSingerGender: (gender: SingerGender) => void;
  artistType: ArtistType;
  setArtistType: (type: ArtistType) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const genres = ['Acoustic', 'Country', 'Electronic', 'Hip Hop', 'Instrumental', 'Jazz', 'Pop', 'R&B', 'Rock'];
const genders: SingerGender[] = ['Female', 'Male'];
const artistTypes: ArtistType[] = ['Solo Artist', 'Group'];

export const PromptForm: React.FC<PromptFormProps> = ({ prompt, setPrompt, genre, setGenre, singerGender, setSingerGender, artistType, setArtistType, onGenerate, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
                <label className="block text-lg font-medium text-gray-300 mb-2">
                    Select a Genre
                </label>
                <div className="flex flex-wrap gap-2">
                    {genres.map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setGenre(g)}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 ${
                                genre === g
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-300 mb-2">
                    Artist Type
                </label>
                <div className="flex flex-wrap gap-2">
                    {artistTypes.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setArtistType(t)}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 ${
                                artistType === t
                                ? 'bg-teal-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-lg font-medium text-gray-300 mb-2">
                    Singer's Voice
                </label>
                <div className="flex flex-wrap gap-2">
                    {genders.map((g) => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => setSingerGender(g)}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-pink-500 ${
                                singerGender === g
                                ? 'bg-pink-600 text-white shadow-lg'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <div>
            <label htmlFor="song-prompt" className="block text-lg font-medium text-gray-300 mb-2">
            What's your song about?
            </label>
            <textarea
            id="song-prompt"
            rows={3}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none placeholder-gray-500"
            placeholder="e.g., A robot falling in love with a toaster"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Generating...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
              </svg>
              Generate Song Draft
            </>
          )}
        </button>
      </form>
    </div>
  );
};
