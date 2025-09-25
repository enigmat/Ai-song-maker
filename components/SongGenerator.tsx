import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SongPromptForm } from './SongPromptForm';
import { SongEditor } from './SongEditor';
import { ArtistProfile } from './ArtistProfile';
import { LyricsViewer } from './LyricsViewer';
import { BeatPlayer } from './BeatPlayer';
import { MasterPlayButton } from './MasterPlayButton';
import { MusicVideoPlayer } from './MusicVideoPlayer';
import { StyleGuideViewer } from './StyleGuideViewer';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { generateSongFromPrompt, generateNewBeatPattern, generateImage, generateVideo, SongData, SingerGender, ArtistType } from '../services/geminiService';

declare var Tone: any; // Using Tone.js from CDN

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

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [isRemixing, setIsRemixing] = useState(false);

    // Tone.js refs
    const synths = useRef<any>({});
    const sequence = useRef<any>(null);


    useEffect(() => {
        // This effect sets up the audio components whenever songData changes
        // It's only active when in the 'display' status.
        if (status !== 'display' || !songData.beatPattern) {
            setIsAudioReady(false);
            return;
        }

        // Cleanup previous Tone instances
        if (sequence.current) sequence.current.dispose();
        Object.values(synths.current).forEach((synth: any) => synth.dispose());

        try {
            const parsedBeat = JSON.parse(songData.beatPattern);
            if (!parsedBeat || typeof parsedBeat !== 'object') {
                throw new Error("Invalid beat pattern format");
            }

            synths.current = {
                kick: new Tone.MembraneSynth().toDestination(),
                snare: new Tone.NoiseSynth({
                    noise: { type: 'white' },
                    envelope: { attack: 0.005, decay: 0.1, sustain: 0 },
                }).toDestination(),
                hihat: new Tone.MetalSynth({
                    frequency: 200,
                    envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
                    harmonicity: 5.1,
                    modulationIndex: 32,
                    resonance: 4000,
                    octaves: 1.5
                }).toDestination(),
                clap: new Tone.NoiseSynth({
                    noise: { type: 'pink' },
                    envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 },
                }).toDestination(),
            };
            
            const steps = Array.from({ length: 16 }, (_, i) => i);

            sequence.current = new Tone.Sequence((time, step) => {
                if (parsedBeat.kick?.includes(step)) synths.current.kick.triggerAttackRelease("C1", "8n", time);
                if (parsedBeat.snare?.includes(step)) synths.current.snare.triggerAttackRelease("16n", time);
                if (parsedBeat.hihat?.includes(step)) synths.current.hihat.triggerAttackRelease("16n", time, 0.6);
                if (parsedBeat.clap?.includes(step)) synths.current.clap.triggerAttackRelease("16n", time);
                
                Tone.Draw.schedule(() => {
                    setCurrentStep(step);
                }, time);

            }, steps, "16n").start(0);

            Tone.Transport.bpm.value = songData.bpm;
            setIsAudioReady(true);
        } catch (e) {
            console.error("Failed to parse beat pattern or initialize Tone.js:", e);
            setError("The generated beat pattern is invalid and cannot be played.");
            setIsAudioReady(false);
        }

        // Cleanup on component unmount or when songData changes again
        return () => {
             if (Tone.Transport.state === 'started') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
             }
             if (sequence.current) sequence.current.dispose();
             Object.values(synths.current).forEach((synth: any) => synth.dispose());
             setCurrentStep(-1);
             setIsPlaying(false);
        };
    }, [songData, status]);


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

    const handleRemix = async () => {
        setIsRemixing(true);
        setError(null);
        try {
            const newBeat = await generateNewBeatPattern(songData.styleGuide, songData.genre);
            setSongData(prev => ({ ...prev, beatPattern: newBeat }));
        } catch(err) {
            console.error("Beat remix failed:", err);
            setError("Failed to generate a new beat. Please try again.");
        } finally {
            setIsRemixing(false);
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
        setStatus('finalizing');
        setIsGeneratingVideo(true);
        setError(null);
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
    
    const handleTogglePlay = async () => {
        if (!isAudioReady) return;

        // Start Tone.js context if it's suspended
        if (Tone.context.state !== 'running') {
            await Tone.start();
        }

        if (isPlaying) {
            Tone.Transport.stop();
            setIsPlaying(false);
            setCurrentStep(-1);
        } else {
            Tone.Transport.start();
            setIsPlaying(true);
        }
    };
    
    const handleBackToPrompt = useCallback(() => {
        if (Tone.Transport.state === 'started') Tone.Transport.stop();
        setStatus('prompt');
        setSongData(defaultSongData);
        setArtistImageUrl('');
        setVideoUrl('');
        setError(null);
        setIsPlaying(false);
        setCurrentStep(-1);
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

                        <div className="text-center">
                            <MasterPlayButton 
                                isPlaying={isPlaying}
                                onToggle={handleTogglePlay}
                                isReady={isAudioReady}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <LyricsViewer lyrics={songData.lyrics} />
                            <BeatPlayer 
                                beatPattern={songData.beatPattern} 
                                isPlaying={isPlaying} 
                                currentStep={currentStep} 
                                onRemix={handleRemix} 
                                isRemixing={isRemixing}
                            />
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