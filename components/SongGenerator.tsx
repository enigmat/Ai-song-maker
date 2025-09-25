import React, { useState, useCallback } from 'react';
import { SongPromptForm } from './SongPromptForm';
import { SongEditor } from './SongEditor';
import { ArtistProfile } from './ArtistProfile';
import { LyricsViewer } from './LyricsViewer';
import { BeatPlayer } from './BeatPlayer';
import { MusicVideoPlayer } from './MusicVideoPlayer';
import { StyleGuideViewer } from './StyleGuideViewer';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { generateSongFromPrompt, generateImage, generateVideo, SongData, SingerGender, ArtistType } from '../services/geminiService';


type AppStatus = 'prompt' | 'generating' | 'editing' | 'finalizing' | 'display' | 'error';

const defaultSongData: SongData = {
    title: '',
    artistName: '',
    artistBio: '',
    artistImagePrompt: '',
    lyrics: '',
    styleGuide: '',
    beatPattern: '',
    singerGender: 'any',
    artistType: 'any',
    vocalMelody: null,
    bpm: 120,
    videoPrompt: '',
    genre: '',
};

export const SongGenerator: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>('prompt');
    const [songData, setSongData] = useState<SongData>(defaultSongData);
    const [error, setError] = useState<string | null>(null);

    const [artistImageUrl, setArtistImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

    const handleGenerate = async (prompt: string, singerGender: SingerGender, artistType: ArtistType, genre: string) => {
        setStatus('generating');
        setError(null);
        setArtistImageUrl('');
        try {
            const data = await generateSongFromPrompt(prompt, singerGender, artistType, genre);
            setSongData(data);
            setStatus('editing');

            // Asynchronously generate the initial image after moving to the editor screen
            setIsGeneratingImage(true);
            generateImage(data.artistImagePrompt)
                .then(imageUrl => {
                    setArtistImageUrl(imageUrl);
                })
                .catch(imgErr => {
                    console.error("Initial image generation failed:", imgErr);
                    setError("Could not generate the initial artist image.");
                })
                .finally(() => {
                    setIsGeneratingImage(false);
                });

        } catch (err) {
            console.error(err);
            setError('Failed to generate song data. Please try a different prompt.');
            setStatus('error');
        }
    };

    const handleRegenerateImage = async () => {
        if (!songData.artistImagePrompt) return;
        setIsGeneratingImage(true);
        setError(null);
        try {
            const imageUrl = await generateImage(songData.artistImagePrompt);
            setArtistImageUrl(imageUrl);
        } catch (err) {
            console.error("Image regeneration failed:", err);
            setError("Failed to regenerate artist image. Please try again.");
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handleFinalize = async () => {
        // Image is handled in the editing step. This function now only handles video generation.
        setStatus('finalizing');
        setIsGeneratingVideo(true);
        setError(null);

        // We can show the display page immediately and let assets load in
        setStatus('display');
        
        try {
            const generatedVideoUrl = await generateVideo(songData.videoPrompt);
            setVideoUrl(generatedVideoUrl);
        } catch(err) {
            console.error("Video generation failed:", err);
            setError("Failed to generate music video.");
        } finally {
            setIsGeneratingVideo(false);
        }
    };
    
    const handleBackToPrompt = useCallback(() => {
        setStatus('prompt');
        setSongData(defaultSongData);
        setArtistImageUrl('');
        setVideoUrl('');
        setError(null);
    }, []);

    const handleBackToEdit = useCallback(() => {
        setStatus('editing');
        setArtistImageUrl('');
        setVideoUrl('');
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'prompt':
            case 'error':
                 return <SongPromptForm onGenerate={handleGenerate} isLoading={false} />;

            case 'generating':
                return (
                    <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-400 text-lg animate-pulse">
                            Generating your song foundation...
                        </p>
                        <p className="text-gray-500">
                            This can take up to a minute.
                        </p>
                    </div>
                );
            case 'editing':
                return (
                    <SongEditor
                        songData={songData}
                        setSongData={setSongData}
                        onFinalize={handleFinalize}
                        onCancel={handleBackToPrompt}
                        isLoading={status === 'finalizing'}
                        onRegenerateImage={handleRegenerateImage}
                        artistImageUrl={artistImageUrl}
                        isRegeneratingImage={isGeneratingImage}
                    />
                );
            
            case 'finalizing':
            case 'display':
                 return (
                    <div className="space-y-8">
                        <ArtistProfile
                            {...songData}
                            artistImageUrl={artistImageUrl}
                            videoUrl={videoUrl}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <LyricsViewer lyrics={songData.lyrics} />
                            <BeatPlayer beatPattern={songData.beatPattern} isPlaying={false} currentStep={-1} onRemix={() => {}} isRemixing={false} />
                        </div>
                        
                        <MusicVideoPlayer videoUrl={videoUrl} isGenerating={isGeneratingVideo} />

                        <StyleGuideViewer styleGuide={songData.styleGuide} isLoading={false} />

                        <div className="text-center pt-4">
                             <button
                                onClick={handleBackToPrompt}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300"
                                aria-label="Create a new song"
                              >
                                Create Another Song
                            </button>
                        </div>

                    </div>
                 );
        }
    }

    return (
        <div>
            {error && <ErrorMessage message={error} />}
            {renderContent()}
        </div>
    );
};