import React, { useState, useCallback, useEffect, useRef } from 'react';
import { SongPromptForm } from './SongPromptForm';
import { SongEditor } from './SongEditor';
import { ArtistProfile } from './ArtistProfile';
import { LyricsViewer } from './LyricsViewer';
import { MasterPlayButton } from './MasterPlayButton';
import { StyleGuideViewer } from './StyleGuideViewer';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { MelodyStudio } from './MelodyStudio';
import { generateSongFromPrompt, generateImage, MelodyAnalysis } from '../services/geminiService';
import { audioBufferToMp3 } from '../services/audioService';
import { Project, SongData } from '../types';
import type { SingerGender, ArtistType, ArtistStyleProfile } from '../services/geminiService';
import { PlaybackContextType } from '../contexts/PlaybackContext';
import { StoryboardViewer } from './StoryboardViewer';


declare var Tone: any; // Using Tone.js from CDN

type AppStatus = 'prompt' | 'generating' | 'editing' | 'finalizing' | 'display' | 'error';

interface SongGeneratorProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
    setPlaybackControls: (controls: PlaybackContextType) => void;
}

const defaultSongData: SongData = {
    title: '', artistName: '', artistBio: '', albumCoverPrompt: '', lyrics: '',
    styleGuide: '', beatPattern: '', singerGender: 'any', artistType: 'any',
    vocalMelody: null, bpm: 120, genre: '', storyboard: '',
};

export const SongGenerator: React.FC<SongGeneratorProps> = ({ project, onUpdateProject, setPlaybackControls }) => {
    const getInitialStatus = (): AppStatus => {
        if (!project.songData) return 'prompt';
        if (project.artistImageUrl) return 'display';
        if (project.songData.lyrics) return 'editing';
        return 'prompt';
    };

    const [status, setStatus] = useState<AppStatus>(getInitialStatus());
    const [songData, setSongData] = useState<SongData>(project.songData || defaultSongData);
    const [artistImageUrl, setArtistImageUrl] = useState(project.artistImageUrl || '');
    
    const [error, setError] = useState<string | null>(null);
    const [isMelodyStudioOpen, setIsMelodyStudioOpen] = useState(false);
    const [hummedInstrumental, setHummedInstrumental] = useState<{ url: string; blob: Blob } | null>(null);
    const [hummedMelody, setHummedMelody] = useState<MelodyAnalysis | null>(null);

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isRenderingMp3, setIsRenderingMp3] = useState(false);
    const [mp3Url, setMp3Url] = useState<string | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isAudioReady, setIsAudioReady] = useState(false);

    const synths = useRef<any>({});
    const sequence = useRef<any>(null);
    const player = useRef<any>(null);

    const effectiveInstrumentalUrl = hummedInstrumental?.url || null;

    const handleDataChange = (updatedData: Partial<SongData>) => {
        const newData = { ...songData, ...updatedData };
        setSongData(newData);
        onUpdateProject({ ...project, songData: newData });
    };

    useEffect(() => {
        const handleTogglePlay = async (force?: 'play' | 'stop') => {
            if (!isAudioReady) return;
            if (Tone.context.state !== 'running') await Tone.start();

            const shouldPlay = force === 'play' ? true : force === 'stop' ? false : !isPlaying;

            if (shouldPlay) {
                Tone.Transport.start();
                setIsPlaying(true);
            } else {
                Tone.Transport.stop();
                setIsPlaying(false);
            }
        };

        const handleSetBpm = (newBpm: number) => {
            if (isAudioReady) {
                Tone.Transport.bpm.value = newBpm;
                handleDataChange({ bpm: newBpm });
            }
        };

        setPlaybackControls({
            play: () => handleTogglePlay('play'),
            stop: () => handleTogglePlay('stop'),
            setBpm: handleSetBpm,
            isPlaying: isPlaying,
        });
    }, [isAudioReady, isPlaying, setPlaybackControls, songData]);


    useEffect(() => {
        if (status !== 'display') {
            setIsAudioReady(false);
            return;
        }
        
        // Initial cleanup before setting up new audio
        if (sequence.current) sequence.current.dispose();
        if (player.current) player.current.dispose();
        Object.values(synths.current).forEach((synth: any) => synth.dispose());
        synths.current = {};
        setIsAudioReady(false);
        
        if (effectiveInstrumentalUrl) {
            player.current = new Tone.Player({
                url: effectiveInstrumentalUrl,
                onload: () => setIsAudioReady(true),
                loop: true,
            }).toDestination();
            player.current.sync().start(0);
            Tone.Transport.bpm.value = songData.bpm;
        } else if (songData.beatPattern) {
            try {
                const parsedBeat = JSON.parse(songData.beatPattern);
                synths.current = {
                    kick: new Tone.MembraneSynth().toDestination(),
                    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
                    hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
                    clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 } }).toDestination(),
                };
                const steps = Array.from({ length: 16 }, (_, i) => i);
                sequence.current = new Tone.Sequence((time, step) => {
                    if (parsedBeat.kick?.includes(step)) synths.current.kick.triggerAttackRelease("C1", "8n", time);
                    if (parsedBeat.snare?.includes(step)) synths.current.snare.triggerAttackRelease("16n", time);
                    if (parsedBeat.hihat?.includes(step)) synths.current.hihat.triggerAttackRelease("16n", time, 0.6);
                    if (parsedBeat.clap?.includes(step)) synths.current.clap.triggerAttackRelease("16n", time);
                }, steps, "16n").start(0);
                sequence.current.loop = true;
                Tone.Transport.bpm.value = songData.bpm;
                setIsAudioReady(true);
            } catch (e) {
                console.error("Failed to parse beat pattern:", e);
                setError("The generated beat pattern is invalid.");
                setIsAudioReady(false);
            }
        }
        
        return () => {
            if (Tone.Transport.state !== 'stopped') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            }
            if (sequence.current) {
                sequence.current.dispose();
                sequence.current = null;
            }
            if (player.current) {
                player.current.dispose();
                player.current = null;
            }
            Object.values(synths.current).forEach((synth: any) => {
                if (synth && typeof synth.dispose === 'function') {
                    synth.dispose();
                }
            });
            synths.current = {};
            setIsPlaying(false);
        };
    }, [songData, status, effectiveInstrumentalUrl]);
    
    useEffect(() => {
      return () => {
        if (hummedInstrumental?.url) URL.revokeObjectURL(hummedInstrumental.url);
        if (mp3Url) URL.revokeObjectURL(mp3Url);
      };
    }, [hummedInstrumental, mp3Url]);


    const handleGenerate = async ( prompt: string, ...styleArgs: any[]) => {
        const [ genre, singerGender, artistType, mood, tempo, melody, harmony, rhythm, instrumentation, atmosphere, vocalStyle ] = styleArgs as [string, SingerGender, ArtistType, string, string, string, string, string, string, string, string];
        const profileParams: ArtistStyleProfile = { genre, singerGender, artistType, mood, tempo, melody, harmony, rhythm, instrumentation, atmosphere, vocalStyle };
        
        onUpdateProject({ ...project, originalPrompt: prompt, generationParams: profileParams });
        setStatus('generating');
        setError(null);
        setArtistImageUrl('');
        if (effectiveInstrumentalUrl) {
            handleDataChange({ ...defaultSongData, bpm: songData.bpm });
        }
        try {
            const data = await generateSongFromPrompt( prompt, genre, singerGender, artistType, mood, tempo, melody, harmony, rhythm, instrumentation, atmosphere, vocalStyle);
            if (effectiveInstrumentalUrl) {
                data.beatPattern = '';
                data.bpm = songData.bpm; 
            }
            if (hummedMelody) {
                // Add hummed melody analysis to style guide
            }
            handleDataChange(data);
            setStatus('editing');
            setIsGeneratingImage(true);
            generateImage(data.albumCoverPrompt).then(imageUrl => {
                setArtistImageUrl(imageUrl);
                onUpdateProject({ ...project, songData: data, artistImageUrl: imageUrl });
            }).catch(imgErr => {
                console.error("Image generation failed:", imgErr);
                setError("Could not generate the artist image.");
            }).finally(() => setIsGeneratingImage(false));
        } catch (err) {
            console.error(err);
            setError('Failed to generate song data. Please try again.');
            setStatus('error');
        }
    };

    const handleRegenerateImage = async () => {
        setIsGeneratingImage(true); setError(null);
        try {
            const imageUrl = await generateImage(songData.albumCoverPrompt);
            setArtistImageUrl(imageUrl);
            onUpdateProject({ ...project, artistImageUrl: imageUrl, songData });
        } catch (err) {
            setError("Failed to regenerate artist image.");
        } finally { setIsGeneratingImage(false); }
    };
    
    const handleFinalize = async () => {
        setStatus('display');
        onUpdateProject({ ...project, songData });
    };
    
    const handleTogglePlay = async () => {
        if (!isAudioReady) return;
        if (Tone.context.state !== 'running') await Tone.start();
        if (isPlaying) { Tone.Transport.stop(); setIsPlaying(false); } 
        else { Tone.Transport.start(); setIsPlaying(true); }
    };
    
    const handleHummedMelodySelect = (blob: Blob, melody: MelodyAnalysis) => {
        if (hummedInstrumental?.url) URL.revokeObjectURL(hummedInstrumental.url);
        const newUrl = URL.createObjectURL(blob);
        setHummedInstrumental({ url: newUrl, blob });
        handleDataChange({ bpm: melody.bpm, beatPattern: '' });
        setHummedMelody(melody);
        setIsMelodyStudioOpen(false);
    };

    const handleGenerateMp3 = async () => {
        if (mp3Url) {
            URL.revokeObjectURL(mp3Url);
            setMp3Url(null);
        }
        setIsRenderingMp3(true);
        setError(null);
    
        try {
            let mp3Blob: Blob;
            if (effectiveInstrumentalUrl) {
                const buffer = await new Tone.Buffer(effectiveInstrumentalUrl).load();
                mp3Blob = audioBufferToMp3(buffer.get());
            } else {
                const bpm = songData.bpm;
                // Render 16 measures. 1 measure = 4 beats. Duration = 16 * 4 * (60/bpm)
                const duration = 16 * 4 * (60 / bpm);
    
                const buffer = await Tone.Offline(async () => {
                    Tone.Transport.bpm.value = bpm;
                    const synths = {
                        kick: new Tone.MembraneSynth().toDestination(),
                        snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination(),
                        hihat: new Tone.MetalSynth({ frequency: 200, envelope: { attack: 0.001, decay: 0.1, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
                        clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.2 } }).toDestination(),
                    };
                    const parsedBeat = JSON.parse(songData.beatPattern);
                    const steps = Array.from({ length: 16 }, (_, i) => i);
                    const seq = new Tone.Sequence((time, step) => {
                        if (parsedBeat.kick?.includes(step)) synths.kick.triggerAttackRelease("C1", "8n", time);
                        if (parsedBeat.snare?.includes(step)) synths.snare.triggerAttackRelease("16n", time);
                        if (parsedBeat.hihat?.includes(step)) synths.hihat.triggerAttackRelease("16n", time, 0.6);
                        if (parsedBeat.clap?.includes(step)) synths.clap.triggerAttackRelease("16n", time);
                    }, steps, "16n").start(0);
                    seq.loop = 15; // Loop 15 times for 16 total measures
                }, duration);
                mp3Blob = audioBufferToMp3(buffer.get());
            }
            setMp3Url(URL.createObjectURL(mp3Blob));
        } catch (err) {
            console.error("MP3 rendering failed:", err);
            setError("Failed to render the MP3 file.");
        } finally {
            setIsRenderingMp3(false);
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'prompt':
            case 'error':
                 return <SongPromptForm onGenerate={handleGenerate} isLoading={false} onOpenMelodyStudio={() => setIsMelodyStudioOpen(true)} />;
            case 'generating':
                return <div className="text-center p-10 bg-gray-800/50 rounded-xl"><LoadingSpinner size="lg" /><p className="mt-4 text-gray-400 text-lg animate-pulse">Generating song...</p></div>;
            case 'editing':
                return <SongEditor songData={songData} setSongData={handleDataChange} onFinalize={handleFinalize} onCancel={() => setStatus('prompt')} isLoading={status === 'finalizing'} onRegenerateImage={handleRegenerateImage} artistImageUrl={artistImageUrl} isRegeneratingImage={isGeneratingImage} onImageUpdate={(url) => { setArtistImageUrl(url); onUpdateProject({ ...project, artistImageUrl: url, songData }); }} />;
            case 'finalizing':
            case 'display':
                 return (
                    <div className="space-y-8">
                        <ArtistProfile {...songData} artistImageUrl={artistImageUrl} />
                        <div className="text-center"><MasterPlayButton isPlaying={isPlaying} onToggle={handleTogglePlay} isReady={isAudioReady} /></div>
                        
                        <div className="mt-8">
                            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-6">
                                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">
                                    Export Audio
                                </h2>
                                {isRenderingMp3 ? (
                                    <div className="text-center text-gray-400 p-4">
                                        <LoadingSpinner size="lg" />
                                        <p className="mt-4 animate-pulse">Rendering MP3, this may take a moment...</p>
                                    </div>
                                ) : mp3Url ? (
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                        <a href={mp3Url} download={`${songData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all transform hover:scale-105">
                                            Download MP3
                                        </a>
                                        <button onClick={handleGenerateMp3} className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all">
                                            Render Again
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <p className="text-gray-400 mb-4">Generate a high-quality MP3 file of your final song.</p>
                                        <button onClick={handleGenerateMp3} className="inline-flex items-center justify-center gap-3 text-lg font-semibold px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                                            Render MP3
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <LyricsViewer lyrics={songData.lyrics} />
                        <StoryboardViewer storyboard={songData.storyboard} />
                        <StyleGuideViewer styleGuide={songData.styleGuide} isLoading={false} />
                        <div className="text-center pt-4">
                             <button onClick={() => setStatus('editing')} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300">
                                Back to Editor
                            </button>
                        </div>
                    </div>
                 );
        }
    }

    return (
        <div>
            {isMelodyStudioOpen && <MelodyStudio onClose={() => setIsMelodyStudioOpen(false)} onMelodySelect={handleHummedMelodySelect} />}
            {error && <ErrorMessage message={error} onRetry={() => setStatus('prompt')} />}
            {renderContent()}
        </div>
    );
};