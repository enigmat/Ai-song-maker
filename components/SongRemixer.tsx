import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RemixPromptForm } from './RemixPromptForm';
import { SongEditor } from './SongEditor';
import { ArtistProfile } from './ArtistProfile';
import { BeatPlayer } from './BeatPlayer';
import { MasterPlayButton } from './MasterPlayButton';
import { StyleGuideViewer } from './StyleGuideViewer';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { generateRemixedSong, generateRemixedSongFromLyrics, generateNewBeatPattern, generateImage, transcribeAudio } from '../services/geminiService';
import type { SongData, SingerGender, ArtistType } from '../types';
import { StoryboardViewer } from './StoryboardViewer';

declare var Tone: any; // Using Tone.js from CDN

type AppStatus = 'prompt' | 'generating' | 'editing' | 'finalizing' | 'display' | 'error';

const defaultSongData: SongData = {
    title: '',
    artistName: '',
    artistBio: '',
    albumCoverPrompt: '',
    lyrics: '',
    styleGuide: '',
    beatPattern: '',
    singerGender: 'any',
    artistType: 'any',
    vocalMelody: null,
    bpm: 120,
    genre: '',
    storyboard: '',
};

export const SongRemixer: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>('prompt');
    const [songData, setSongData] = useState<SongData>(defaultSongData);
    const [error, setError] = useState<string | null>(null);

    const [artistImageUrl, setArtistImageUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [generationStatusText, setGenerationStatusText] = useState('Remixing your song...');

    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [isRandomizingBeat, setIsRandomizingBeat] = useState(false);

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
        synths.current = {};

        try {
            const patternString = songData.beatPattern.replace(/```json\n?|\n?```/g, '').trim();
            const parsedBeat = JSON.parse(patternString);
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
             if (Tone.Transport.state !== 'stopped') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            }
            if (sequence.current) {
                sequence.current.dispose();
                sequence.current = null;
            }
            Object.values(synths.current).forEach((synth: any) => {
                if (synth && typeof synth.dispose === 'function') {
                    synth.dispose();
                }
            });
            synths.current = {};
            setCurrentStep(-1);
            setIsPlaying(false);
        };
    }, [songData, status]);


    const handleGenerate = async (
        details: { originalTitle: string; originalArtist: string; audioFile: File | null; lyrics: string | null; },
        targetGenre: string,
        singerGender: SingerGender,
        artistType: ArtistType,
        mood: string,
        remixPrompt: string,
    ) => {
        setStatus('generating');
        setError(null);
        setArtistImageUrl('');
        try {
            let data: SongData;

            if (details.lyrics) {
                setGenerationStatusText('Generating remix from your lyrics...');
                data = await generateRemixedSongFromLyrics(
                    details.lyrics,
                    'pasted_lyrics.txt',
                    targetGenre,
                    singerGender,
                    artistType,
                    mood,
                    remixPrompt,
                );
            } else if (details.audioFile) {
                setGenerationStatusText('Transcribing audio...');
                const transcribedLyrics = await transcribeAudio(details.audioFile);
                if (!transcribedLyrics || transcribedLyrics.trim().length === 0) {
                    throw new Error("Transcription failed or the audio contains no speech.");
                }
                setGenerationStatusText('Generating remix from lyrics...');
                data = await generateRemixedSongFromLyrics(
                    transcribedLyrics,
                    details.audioFile.name,
                    targetGenre,
                    singerGender,
                    artistType,
                    mood,
                    remixPrompt,
                );
            } else {
                setGenerationStatusText('Remixing from title...');
                data = await generateRemixedSong(
                    details.originalTitle,
                    details.originalArtist,
                    targetGenre,
                    singerGender,
                    artistType,
                    mood,
                    remixPrompt,
                );
            }

            setSongData(data);
            setStatus('editing');

            // Asynchronously generate the initial image after moving to the editor screen
            setIsGeneratingImage(true);
            generateImage(data.albumCoverPrompt)
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

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to generate song data. Please try a different prompt.');
            setStatus('error');
        }
    };

    const handleRandomizeBeat = async () => {
        if (!songData.styleGuide || !songData.genre) {
            setError("Cannot randomize beat without a style guide and genre.");
            return;
        }
        setIsRandomizingBeat(true);
        setError(null);
        try {
            const prompt = `A beat for a ${songData.genre} song. Style guide: ${songData.styleGuide}`;
            const newBeat = await generateNewBeatPattern(prompt);
            setSongData(prev => ({ ...prev, beatPattern: newBeat }));
        } catch(err) {
            console.error("Beat randomization failed:", err);
            setError("Failed to generate a new beat. Please try again.");
        } finally {
            setIsRandomizingBeat(false);
        }
    };

    const handleRegenerateImage = async () => {
        if (!songData.albumCoverPrompt) return;
        setIsGeneratingImage(true);
        setError(null);
        try {
            const imageUrl = await generateImage(songData.albumCoverPrompt);
            setArtistImageUrl(imageUrl);
        } catch (err) {
            console.error("Image regeneration failed:", err);
            setError("Failed to regenerate artist image. Please try again.");
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handleFinalize = async () => {
        setStatus('display');
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
        setError(null);
        setIsPlaying(false);
        setCurrentStep(-1);
    }, []);

    const handleBeatPatternChange = useCallback((newPattern: string) => {
        setSongData(prev => ({...prev, beatPattern: newPattern}));
    }, []);

    const renderContent = () => {
        switch (status) {
            case 'prompt':
            case 'error':
                 return <RemixPromptForm onGenerate={handleGenerate} isLoading={status === 'generating'} />;

            case 'generating':
                return (
                    <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-400 text-lg animate-pulse">
                            {generationStatusText}
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
                        onImageUpdate={setArtistImageUrl}
                    />
                );
            
            case 'finalizing':
            case 'display':
                 return (
                    <div className="space-y-8">
                        <ArtistProfile
                            {...songData}
                            artistImageUrl={artistImageUrl}
                        />

                        <div className="text-center">
                            <MasterPlayButton 
                                isPlaying={isPlaying}
                                onToggle={handleTogglePlay}
                                isReady={isAudioReady}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <StoryboardViewer storyboard={songData.storyboard} lyrics={songData.lyrics} />
                            <BeatPlayer 
                                beatPattern={songData.beatPattern} 
                                isPlaying={isPlaying} 
                                currentStep={currentStep} 
                                onRandomize={handleRandomizeBeat} 
                                isRandomizing={isRandomizingBeat}
                                trackUrl={null}
                                onBeatPatternChange={handleBeatPatternChange}
                            />
                        </div>
                        
                        <StyleGuideViewer styleGuide={songData.styleGuide} isLoading={false} />

                        <div className="text-center pt-4">
                             <button
                                onClick={handleBackToPrompt}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300"
                                aria-label="Create a new song"
                              >
                                Create Another Remix
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