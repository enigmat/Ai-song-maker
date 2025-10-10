import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { LyricsViewer } from './LyricsViewer';
import { StoryboardViewer } from './StoryboardViewer';
import {
    generateAlbumDetails,
    generateSongFromPrompt,
    generateImage,
} from '../services/geminiService';
import { SongData, AlbumData } from '../types';
import { genres, moods, tempos, melodies, harmonies, rhythms, instrumentations, atmospheres, vocalStyles } from '../constants/music';

type Status = 'prompt' | 'generating' | 'display' | 'error';

const SelectInput: React.FC<{
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: readonly string[];
    disabled: boolean;
}> = ({ label, value, onChange, options, disabled }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
            disabled={disabled}
        >
            {options.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
    </div>
);

const TrackDetailModal: React.FC<{ track: SongData, onClose: () => void }> = ({ track, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-200 truncate pr-4">{track.title}</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>
            <main className="flex-grow p-6 overflow-y-auto space-y-6">
                <LyricsViewer lyrics={track.lyrics} />
                <StoryboardViewer storyboard={track.storyboard} />
            </main>
        </div>
    </div>
);

export const AlbumGenerator: React.FC = () => {
    const [status, setStatus] = useState<Status>('prompt');
    const [error, setError] = useState<string | null>(null);
    const [albumData, setAlbumData] = useState<AlbumData | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<SongData | null>(null);
    
    // Form state
    const [albumPrompt, setAlbumPrompt] = useState('');
    const [albumName, setAlbumName] = useState('');
    const [artistName, setArtistName] = useState('');
    const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
    const [coverArtPreview, setCoverArtPreview] = useState<string | null>(null);
    const [numTracks, setNumTracks] = useState(4);
    const [genre, setGenre] = useState(genres[0]);

    const [generationProgress, setGenerationProgress] = useState({ step: '', current: 0, total: 1 });
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setCoverArtFile(file);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverArtPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setCoverArtFile(null);
            setCoverArtPreview(null);
            if (e.target.files && e.target.files.length > 0) {
                setError('Please select a valid image file.');
            }
        }
    };

    const handleGenerate = async () => {
        if (!albumPrompt.trim() || !albumName.trim() || !artistName.trim()) {
            setError("Please fill out the Album Name, Artist Name, and Album Concept fields.");
            return;
        }
        setStatus('generating');
        setError(null);
        setAlbumData(null);

        const totalSteps = numTracks + 2; // 1 for concept, 1 for cover, N for tracks

        try {
            // 1. Generate Album Details
            setGenerationProgress({ step: 'Developing album concept...', current: 1, total: totalSteps });
            const albumDetails = await generateAlbumDetails(albumPrompt, numTracks, genre, albumName, artistName, !coverArtFile);
            
            let finalAlbumCoverUrl = '';

            // 2. Handle Album Cover
            if (coverArtPreview) {
                 setGenerationProgress({ step: 'Using provided album cover...', current: 2, total: totalSteps });
                 finalAlbumCoverUrl = coverArtPreview;
            } else {
                setGenerationProgress({ step: 'Designing album cover...', current: 2, total: totalSteps });
                finalAlbumCoverUrl = await generateImage(albumDetails.albumCoverPrompt);
            }

            // 3. Generate each track
            let allTracks: SongData[] = [];
            for (let i = 0; i < albumDetails.tracklist.length; i++) {
                const trackInfo = albumDetails.tracklist[i];
                setGenerationProgress({ step: `Writing track ${i + 1}/${albumDetails.tracklist.length}: "${trackInfo.title}"`, current: 3 + i, total: totalSteps });

                const songPrompt = `For an album titled "${albumName}" by artist "${artistName}", generate a complete song package for the track titled "${trackInfo.title}".
                The concept for this specific track is: "${trackInfo.concept}".
                The overall album concept is: "${albumPrompt}".
                IMPORTANT: You MUST use the artist name "${artistName}" and artist bio "${albumDetails.artistBio}" in your response. The song title must be exactly "${trackInfo.title}".
                Adhere strictly to the provided genre.`;
                
                const trackData = await generateSongFromPrompt(songPrompt, genre, 'any', 'any', moods[0], tempos[2], melodies[0], harmonies[0], rhythms[0], instrumentations[0], atmospheres[0], vocalStyles[0]);
                
                trackData.artistName = artistName;
                trackData.artistBio = albumDetails.artistBio;
                trackData.title = trackInfo.title;

                allTracks.push(trackData);
            }
            
            setAlbumData({
                albumTitle: albumName,
                artistName: artistName,
                artistBio: albumDetails.artistBio,
                albumCoverPrompt: albumDetails.albumCoverPrompt,
                albumCoverUrl: finalAlbumCoverUrl,
                tracks: allTracks,
            });

            setStatus('display');

        } catch (err) {
            console.error('Album generation failed:', err);
            setError('An error occurred during album generation. Please try again.');
            setStatus('error');
        }
    };
    
    const handleReset = () => {
        setStatus('prompt');
        setError(null);
        setAlbumData(null);
        setAlbumPrompt('');
        setAlbumName('');
        setArtistName('');
        setCoverArtFile(null);
        setCoverArtPreview(null);
    };

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            {selectedTrack && <TrackDetailModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />}
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Album Generator
            </h2>

            {error && <ErrorMessage message={error} />}
            
            {status === 'prompt' && (
                <div className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="album-name" className="block text-sm font-medium text-gray-400 mb-2">Album Name</label>
                            <input id="album-name" type="text" value={albumName} onChange={(e) => setAlbumName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Chronicles of a Star Sailor'" />
                        </div>
                         <div>
                            <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">Artist Name</label>
                            <input id="artist-name" type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'The Cosmic Drifters'" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="album-prompt" className="block text-sm font-medium text-gray-400 mb-2">Album Concept</label>
                        <textarea id="album-prompt" rows={3} value={albumPrompt} onChange={(e) => setAlbumPrompt(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'A synth-pop concept album about a robot falling in love with a star.'" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                             <label htmlFor="cover-art-file" className="block text-sm font-medium text-gray-400 mb-2">Album Cover (Optional)</label>
                             <input id="cover-art-file" type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-600/50 file:text-purple-200 hover:file:bg-purple-600/70" />
                             <p className="text-xs text-gray-500 mt-1">If you don't upload an image, one will be generated by AI.</p>
                        </div>
                        {coverArtPreview && (
                            <div className="mt-2 text-center">
                                <img src={coverArtPreview} alt="Album cover preview" className="w-24 h-24 rounded-md inline-block border-2 border-gray-600" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="num-tracks" className="block text-sm font-medium text-gray-400 mb-2">Number of Tracks ({numTracks})</label>
                            <input id="num-tracks" type="range" min="3" max="7" value={numTracks} onChange={(e) => setNumTracks(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                        </div>
                        <SelectInput label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={genres} disabled={false} />
                    </div>

                    <button onClick={handleGenerate} disabled={!albumPrompt.trim() || !albumName.trim() || !artistName.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50">Generate Album</button>
                </div>
            )}
            
            {status === 'generating' && (
                <div className="text-center p-10">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-400 text-lg animate-pulse">{generationProgress.step}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}></div>
                    </div>
                </div>
            )}

            {status === 'display' && albumData && (
                <div className="space-y-8 mt-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <img src={albumData.albumCoverUrl} alt={`Album cover for ${albumData.albumTitle}`} className="w-48 h-48 rounded-lg shadow-lg border-4 border-purple-500/50 flex-shrink-0" />
                        <div className="text-center md:text-left">
                             <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">{albumData.albumTitle}</h3>
                             <p className="text-2xl font-semibold text-gray-300">{albumData.artistName}</p>
                             <p className="mt-2 text-sm text-gray-400">{albumData.artistBio}</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-gray-200 mb-4">Tracklist</h4>
                        <div className="bg-gray-900/50 rounded-lg border border-gray-700">
                           {albumData.tracks.map((track, index) => (
                               <div key={index} className="flex items-center justify-between p-3 border-b border-gray-700/50 last:border-b-0">
                                   <div className="flex items-center gap-4">
                                       <span className="text-gray-500 font-mono text-lg">{index + 1}</span>
                                       <span className="font-semibold text-gray-200">{track.title}</span>
                                   </div>
                                   <button onClick={() => setSelectedTrack(track)} className="px-3 py-1 text-sm font-semibold bg-teal-600 text-white rounded-full hover:bg-teal-500 transition-colors">View Details</button>
                               </div>
                           ))}
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white">Create Another Album</button>
                    </div>
                </div>
            )}
        </div>
    );
};