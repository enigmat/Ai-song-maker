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
import { MelodyStudio } from './MelodyStudio';
import { generateSongFromPrompt, generateNewBeatPattern, generateImage, generateVideo, refineVideoPrompt, SongData, SingerGender, ArtistType, ArtistStyleProfile, StoredArtistProfile, ArtistSong, MelodyAnalysis } from '../services/geminiService';

declare var Tone: any; // Using Tone.js from CDN

type AppStatus = 'prompt' | 'generating' | 'editing' | 'finalizing' | 'display' | 'error';

interface SongGeneratorProps {
    instrumentalTrackUrl: string | null;
    clearInstrumentalTrack: () => void;
}

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
    videoPrompt: '',
    genre: '',
};

export const SongGenerator: React.FC<SongGeneratorProps> = ({ instrumentalTrackUrl, clearInstrumentalTrack }) => {
    const [status, setStatus] = useState<AppStatus>('prompt');
    const [songData, setSongData] = useState<SongData>(defaultSongData);
    const [generationParams, setGenerationParams] = useState<ArtistStyleProfile | null>(null);
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isMelodyStudioOpen, setIsMelodyStudioOpen] = useState(false);
    const [hummedInstrumental, setHummedInstrumental] = useState<{ url: string; blob: Blob } | null>(null);
    const [hummedMelody, setHummedMelody] = useState<MelodyAnalysis | null>(null);

    const [artistImageUrl, setArtistImageUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [isRefiningVideoPrompt, setIsRefiningVideoPrompt] = useState(false);


    // Audio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(-1);
    const [isAudioReady, setIsAudioReady] = useState(false);
    const [isRandomizingBeat, setIsRandomizingBeat] = useState(false);

    // Tone.js refs
    const synths = useRef<any>({});
    const sequence = useRef<any>(null);
    const player = useRef<any>(null);

    const effectiveInstrumentalUrl = hummedInstrumental?.url || instrumentalTrackUrl;

    useEffect(() => {
        // This effect sets up the audio components whenever songData changes
        // It's only active when in the 'display' status.
        if (status !== 'display') {
            setIsAudioReady(false);
            return;
        }

        // Cleanup previous Tone instances
        if (sequence.current) sequence.current.dispose();
        if (player.current) player.current.dispose();
        Object.values(synths.current).forEach((synth: any) => synth.dispose());
        setIsAudioReady(false);
        
        if (effectiveInstrumentalUrl) {
            try {
                player.current = new Tone.Player({
                    url: effectiveInstrumentalUrl,
                    onload: () => {
                        setIsAudioReady(true);
                    },
                    loop: true,
                }).toDestination();
                
                player.current.sync().start(0);
                Tone.Transport.bpm.value = songData.bpm;

            } catch(e) {
                console.error("Failed to load instrumental track:", e);
                setError("The instrumental track is invalid and cannot be played.");
                setIsAudioReady(false);
            }
        } else if (songData.beatPattern) {
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
        }

        // Cleanup on component unmount or when songData changes again
        return () => {
             if (Tone.Transport.state === 'started') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
             }
             if (sequence.current) sequence.current.dispose();
             if (player.current) player.current.dispose();
             Object.values(synths.current).forEach((synth: any) => synth.dispose());
             setCurrentStep(-1);
             setIsPlaying(false);
        };
    }, [songData, status, effectiveInstrumentalUrl]);
    
    // Cleanup for hummed instrumental URL
    useEffect(() => {
      return () => {
        if (hummedInstrumental?.url) {
          URL.revokeObjectURL(hummedInstrumental.url);
        }
      };
    }, [hummedInstrumental]);


    const handleGenerate = async (
        prompt: string,
        genre: string,
        singerGender: SingerGender,
        artistType: ArtistType,
        mood: string,
        tempo: string,
        melody: string,
        harmony: string,
        rhythm: string,
        instrumentation: string,
        atmosphere: string,
        vocalStyle: string
    ) => {
        setOriginalPrompt(prompt);
        // Save params for later saving as a profile
        const profileParams: ArtistStyleProfile = {
            genre, singerGender, artistType, mood, tempo, melody,
            harmony, rhythm, instrumentation, atmosphere, vocalStyle
        };
        setGenerationParams(profileParams);

        setStatus('generating');
        setError(null);
        setArtistImageUrl('');
        if (effectiveInstrumentalUrl) {
            // When generating a new song with an existing instrumental,
            // we keep the instrumental but clear the old beat pattern data.
            setSongData(prev => ({ ...defaultSongData, bpm: prev.bpm }));
        }
        try {
            const data = await generateSongFromPrompt(
                prompt, genre, singerGender, artistType, mood, tempo,
                melody, harmony, rhythm, instrumentation, atmosphere, vocalStyle
            );
             // If we used an instrumental, don't overwrite the BPM and clear the new beat pattern
            if (effectiveInstrumentalUrl) {
                data.beatPattern = '';
                data.bpm = songData.bpm; 
            }

            if (hummedMelody && hummedMelody.notes.length > 0) {
                const pitchToMidi = (pitch: string): number => {
                    const noteMap: { [key: string]: number } = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
                    const regex = /^([A-G][b#]?)([0-9])$/;
                    const match = pitch.match(regex);
                    if (!match) return 60; // Default to C4 if parse fails
                    const note = match[1];
                    const octave = parseInt(match[2], 10);
                    return 12 * (octave + 1) + noteMap[note];
                };

                const midiToPitch = (midi: number): string => {
                    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const octave = Math.floor(midi / 12) - 1;
                    const note = notes[midi % 12];
                    return `${note}${octave}`;
                };

                const pitches = hummedMelody.notes.map(n => pitchToMidi(n.pitch));
                const minPitch = Math.min(...pitches);
                const maxPitch = Math.max(...pitches);
                const lowNote = midiToPitch(minPitch);
                const highNote = midiToPitch(maxPitch);
                const rangeDescription = lowNote && highNote ? `from ${lowNote} to ${highNote}` : 'a narrow range';

                const averageDuration = hummedMelody.notes.reduce((sum, note) => sum + note.duration, 0) / hummedMelody.notes.length;
                let rhythmDescription = 'varied';
                if (averageDuration < 0.2) rhythmDescription = 'fast and staccato';
                else if (averageDuration > 0.5) rhythmDescription = 'slow and legato';
                
                let ascending = 0;
                let descending = 0;
                for (let i = 1; i < pitches.length; i++) {
                    if (pitches[i] > pitches[i-1]) ascending++;
                    else if (pitches[i] < pitches[i-1]) descending++;
                }

                let contourDescription = 'varied with leaps';
                if (ascending > descending * 1.5) contourDescription = 'mostly ascending';
                else if (descending > ascending * 1.5) contourDescription = 'mostly descending';
                else if (ascending > 0 && descending > 0) contourDescription = 'undulating';
                else if (ascending > 0) contourDescription = 'ascending';
                else if (descending > 0) contourDescription = 'descending';
                else contourDescription = 'monotonic';

                const melodyInfo = `
Vocal Melody Guide (from hummed input):
- Melody Range: The hummed melody spans a range ${rangeDescription}.
- Rhythm: The melody has a ${rhythmDescription} feel based on note durations.
- Contour: The melodic shape is ${contourDescription}.`;
                
                data.styleGuide = (data.styleGuide || '').trim() + `\n\n${melodyInfo.trim()}`;
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

        } catch (err) {
            console.error(err);
            setError('Failed to generate song data. Please try a different prompt.');
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
            const newBeat = await generateNewBeatPattern(songData.styleGuide, songData.genre);
            setSongData(prev => ({ ...prev, beatPattern: newBeat }));
        } catch(err) {
            console.error("Beat randomization failed:", err);
            setError("Failed to generate a new beat. Please try again.");
        } finally {
            setIsRandomizingBeat(false);
        }
    };

    const handleBeatPatternChange = useCallback((newPattern: string) => {
        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause();
        }
        setSongData(prev => ({...prev, beatPattern: newPattern}));
         if (Tone.Transport.state === 'paused') {
            Tone.Transport.start();
        }
    }, []);

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
    
    const handleRefineVideoPrompt = async () => {
        setIsRefiningVideoPrompt(true);
        setError(null);
        try {
            const newPrompt = await refineVideoPrompt(songData);
            setSongData(prev => ({ ...prev, videoPrompt: newPrompt }));
        } catch (err) {
            console.error("Video prompt refinement failed:", err);
            setError("Failed to refine the video prompt.");
        } finally {
            setIsRefiningVideoPrompt(false);
        }
    };
    
    const handleFinalize = async () => {
        // Save the artist profile with the final artist name and song data
        if (generationParams && songData.artistName) {
            const newSong: ArtistSong = {
                title: songData.title,
                songPrompt: originalPrompt,
                videoPrompt: songData.videoPrompt,
                lyrics: songData.lyrics,
                albumCoverPrompt: songData.albumCoverPrompt,
                createdAt: new Date().toISOString(),
            };
            
            try {
                const storedProfilesRaw = localStorage.getItem('mustbmusic_artist_profiles');
                const storedProfiles: Record<string, StoredArtistProfile> = storedProfilesRaw ? JSON.parse(storedProfilesRaw) : {};
                
                const artistName = songData.artistName;
                const existingProfile = storedProfiles[artistName];

                if (existingProfile) {
                    // Artist exists, add song to their list, preventing duplicates by title
                    if (!existingProfile.songs.some(s => s.title === newSong.title)) {
                        existingProfile.songs.push(newSong);
                    }
                } else {
                    // New artist, create a full profile for them
                    storedProfiles[artistName] = {
                        style: generationParams,
                        songs: [newSong]
                    };
                }
                localStorage.setItem('mustbmusic_artist_profiles', JSON.stringify(storedProfiles));
            } catch (e) {
                console.error("Failed to save artist profile:", e);
                // Non-critical error, so we don't show it to the user.
            }
        }
        
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
        setHummedInstrumental(null);
        setHummedMelody(null);
        clearInstrumentalTrack();
        setGenerationParams(null);
        setOriginalPrompt('');
    }, [clearInstrumentalTrack]);
    
    const handleHummedMelodySelect = (blob: Blob, melody: MelodyAnalysis) => {
        if (hummedInstrumental?.url) {
            URL.revokeObjectURL(hummedInstrumental.url);
        }
        clearInstrumentalTrack(); // Clear any track from other tools

        const newUrl = URL.createObjectURL(blob);
        setHummedInstrumental({ url: newUrl, blob });
        setSongData(prev => ({...prev, bpm: melody.bpm, beatPattern: '' })); // Use BPM from melody and clear beat
        setHummedMelody(melody);
        setIsMelodyStudioOpen(false);
    };

    const renderContent = () => {
        switch (status) {
            case 'prompt':
            case 'error':
                 return <SongPromptForm onGenerate={handleGenerate} isLoading={false} onOpenMelodyStudio={() => setIsMelodyStudioOpen(true)} />;

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
                        onImageUpdate={setArtistImageUrl}
                        onRefineVideoPrompt={handleRefineVideoPrompt}
                        isRefiningVideoPrompt={isRefiningVideoPrompt}
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
                                onRandomize={handleRandomizeBeat} 
                                isRandomizing={isRandomizingBeat}
                                trackUrl={effectiveInstrumentalUrl}
                                onBeatPatternChange={handleBeatPatternChange}
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
            {isMelodyStudioOpen && (
                <MelodyStudio
                    onClose={() => setIsMelodyStudioOpen(false)}
                    onMelodySelect={handleHummedMelodySelect}
                />
            )}
            {error && <ErrorMessage message={error} />}
            {renderContent()}
        </div>
    );
};