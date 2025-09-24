import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { LyricsViewer } from './components/LyricsViewer';
import { StyleGuideViewer } from './components/StyleGuideViewer';
import { ErrorMessage } from './components/ErrorMessage';
import { ArtistProfile } from './components/ArtistProfile';
import { SongEditor } from './components/SongEditor';
import { generateSong, generateArtistVideo, remixBeat, generateVocalMelody, VocalMelody } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';
import { BeatPlayer } from './components/BeatPlayer';
import { MusicVisualizer } from './components/MusicVisualizer';

// Declaration for Tone.js from CDN
declare const Tone: any;

export type SingerGender = 'Female' | 'Male';
export type ArtistType = 'Solo Artist' | 'Group' | 'Duet';

interface SongData {
  title: string;
  artistName: string;
  artistBio: string;
  artistImagePrompt: string;
  lyrics: string;
  styleGuide: string;
  singerGender: SingerGender;
  artistType: ArtistType;
  beatPattern: string;
  vocalMelody: VocalMelody | null;
  bpm: number;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('Pop');
  const [singerGender, setSingerGender] = useState<SingerGender>('Female');
  const [artistType, setArtistType] = useState<ArtistType>('Solo Artist');
  
  const [appState, setAppState] = useState<'prompt' | 'editing' | 'display'>('prompt');
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [isGeneratingAudioVideo, setIsGeneratingAudioVideo] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  const [songData, setSongData] = useState<SongData>({
    title: '',
    artistName: '',
    artistBio: '',
    artistImagePrompt: '',
    lyrics: '',
    styleGuide: '',
    singerGender: 'Female',
    artistType: 'Solo Artist',
    beatPattern: '',
    vocalMelody: null,
    bpm: 120,
  });
  const [artistVideoUrl, setArtistVideoUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [currentBeatStep, setCurrentBeatStep] = useState<number>(-1);

  const [isRemixing, setIsRemixing] = useState<boolean>(false);
  const audioContextReady = useRef(false);
  
  const audioResources = useRef<any>({
      vocalSynth: null,
      drumSynths: {},
      beatSequence: null,
      melodyPart: null,
      analyser: null,
  });
  
  useEffect(() => {
    const loadSongFromURL = () => {
        const params = new URLSearchParams(window.location.search);
        const songDataEncoded = params.get('song');

        if (songDataEncoded) {
            try {
                const songDataJson = atob(songDataEncoded);
                const loadedSong = JSON.parse(songDataJson);

                if (loadedSong.title && loadedSong.artistName && loadedSong.lyrics) {
                    setSongData({
                      title: loadedSong.title,
                      artistName: loadedSong.artistName,
                      artistBio: loadedSong.artistBio || '',
                      lyrics: loadedSong.lyrics,
                      styleGuide: loadedSong.styleGuide || '',
                      artistImagePrompt: loadedSong.artistImagePrompt || '',
                      singerGender: loadedSong.singerGender || (loadedSong.artistType === 'Duet' ? 'Female' : 'Female'),
                      artistType: loadedSong.artistType || 'Solo Artist',
                      beatPattern: loadedSong.beatPattern || '',
                      vocalMelody: loadedSong.vocalMelody || null,
                      bpm: loadedSong.bpm || 120,
                    });
                    setArtistVideoUrl(loadedSong.artistVideoUrl || '');
                    setAppState('display');
                }
                
                window.history.replaceState({}, document.title, window.location.pathname);

            } catch (error) {
                console.error("Failed to parse song data from URL", error);
                setError("Could not load the shared song. The link may be invalid.");
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    };
    loadSongFromURL();
  }, []);

  const stopPlayback = useCallback(() => {
    if (typeof Tone !== 'undefined') {
        Tone.Transport.stop();
        Tone.Transport.position = 0;
    }
    setIsPlaying(false);
    setCurrentLineIndex(-1);
    setCurrentBeatStep(-1);
  }, []);

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a song idea.');
      return;
    }
    setIsGeneratingText(true);
    setError(null);
    stopPlayback();

    try {
      const generatedData = await generateSong(prompt, genre, artistType);
      setSongData({
        ...generatedData,
        singerGender: singerGender,
        artistType: artistType,
        vocalMelody: null,
      });
      setAppState('editing');
    } catch (err) {
      console.error(err);
      setError('Failed to generate the song draft. Please check the console and try again.');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleFinalizeSong = async () => {
    if (!songData.artistImagePrompt.trim()) {
      setError('Please provide a prompt for the artist image.');
      return;
    }
    setIsGeneratingAudioVideo(true);
    setError(null);

    const messages = [
        "Composing vocal melody...",
        "Warming up the video cameras...",
        "Setting the scene...",
        "Directing your artist...",
        "Rolling camera... Action!",
        "Rendering the final cut...",
        "This can take a few minutes...",
    ];
    let messageIndex = 0;
    
    const updateStatus = () => setGenerationStatus(messages[messageIndex]);
    updateStatus();

    const intervalId = setInterval(() => {
        if (messageIndex < messages.length - 2) {
            messageIndex = (messageIndex + 1);
            updateStatus();
        }
    }, 5000);

    try {
      const melody = await generateVocalMelody(songData.lyrics, songData.styleGuide);
      setSongData(prev => ({ ...prev, vocalMelody: melody }));
      
      messageIndex = 1; // Move to video messages
      updateStatus();

      const videoUrl = await generateArtistVideo(songData.artistImagePrompt);
      setArtistVideoUrl(videoUrl);
      setAppState('display');
    } catch (err) {
      console.error(err);
      setError('Failed to generate the artist assets. Please check the console and try again.');
       setAppState('editing');
    } finally {
      setIsGeneratingAudioVideo(false);
      clearInterval(intervalId);
      setGenerationStatus('');
    }
  };

  const handleStartOver = useCallback(() => {
    stopPlayback();
    setAppState('prompt');
    setPrompt('');
    setGenre('Pop');
    setSingerGender('Female');
    setArtistType('Solo Artist');
    setSongData({
      title: '',
      artistName: '',
      artistBio: '',
      artistImagePrompt: '',
      lyrics: '',
      styleGuide: '',
      singerGender: 'Female',
      artistType: 'Solo Artist',
      beatPattern: '',
      vocalMelody: null,
      bpm: 120,
    });
    setArtistVideoUrl('');
    setError(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [stopPlayback]);

  const handlePlaybackToggle = async () => {
      if (typeof Tone === 'undefined') return;
      if (!audioContextReady.current) {
          await Tone.start();
          audioContextReady.current = true;
      }

      if (isPlaying) {
          stopPlayback();
      } else {
          setIsPlaying(true);
          Tone.Transport.start();
      }
  }

  const handleRemixBeat = async () => {
      if (!songData.styleGuide) {
          setError("Cannot remix without a style guide.");
          return;
      }
      setIsRemixing(true);
      setError(null);
      try {
          const newBeatPattern = await remixBeat(songData.styleGuide);
          setSongData(prev => ({ ...prev, beatPattern: newBeatPattern }));
      } catch (err) {
          console.error(err);
          setError("Failed to remix the beat. Please try again.");
      } finally {
          setIsRemixing(false);
      }
  };

  // Centralized Tone.js effect
  useEffect(() => {
    if (typeof Tone === 'undefined') return;
    
    Tone.Transport.bpm.value = songData.bpm;

    if (appState !== 'display') return;

    // Cleanup function
    const cleanupAudio = () => {
        stopPlayback();
        Object.values(audioResources.current.drumSynths).forEach((synth: any) => synth.dispose());
        if (audioResources.current.vocalSynth) audioResources.current.vocalSynth.dispose();
        if (audioResources.current.beatSequence) audioResources.current.beatSequence.dispose();
        if (audioResources.current.melodyPart) audioResources.current.melodyPart.dispose();
        if (audioResources.current.analyser) {
            Tone.getDestination().disconnect(audioResources.current.analyser);
            audioResources.current.analyser.dispose();
        }
        audioResources.current = { drumSynths: {}, beatSequence: null, melodyPart: null, vocalSynth: null, analyser: null };
    };
    
    // Setup Analyser for visualization
    audioResources.current.analyser = new Tone.Analyser('waveform', 1024);
    Tone.getDestination().connect(audioResources.current.analyser);

    // Setup Synths
    audioResources.current.vocalSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
    }).toDestination();
    audioResources.current.drumSynths = {
        kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" } }).toDestination(),
        snare: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.2, sustain: 0 } }).toDestination(),
        hihat: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }).toDestination(),
        clap: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }).toDestination(),
    };

    // Setup Beat
    try {
        const beat = JSON.parse(songData.beatPattern);
        const steps = Array.from({ length: 16 }, (_, i) => i);
        audioResources.current.beatSequence = new Tone.Sequence((time: any, step: number) => {
            if (beat.kick?.includes(step)) { audioResources.current.drumSynths.kick.triggerAttackRelease("C1", "8n", time); }
            if (beat.snare?.includes(step)) { audioResources.current.drumSynths.snare.triggerAttackRelease("16n", time); }
            if (beat.clap?.includes(step)) { audioResources.current.drumSynths.clap.triggerAttackRelease("16n", time); }
            if (beat.hihat?.includes(step)) { audioResources.current.drumSynths.hihat.triggerAttackRelease("16n", time); }
            Tone.Draw.schedule(() => setCurrentBeatStep(step), time);
        }, steps, "16n").start(0);
    } catch(e) { console.error("Could not parse beat", e); }

    // Setup Melody
    if (songData.vocalMelody) {
        const melodyEvents = songData.vocalMelody.flatMap(line => 
            line.notes.map(note => ({ ...note, lineIndex: line.lineIndex }))
        );
        audioResources.current.melodyPart = new Tone.Part((time, value) => {
            audioResources.current.vocalSynth.triggerAttackRelease(value.note, value.duration, time);
            Tone.Draw.schedule(() => setCurrentLineIndex(value.lineIndex), time);
        }, melodyEvents).start(0);
        audioResources.current.melodyPart.loop = false;
    }
    
    Tone.Transport.on('stop', () => {
        setIsPlaying(false);
        setCurrentLineIndex(-1);
        setCurrentBeatStep(-1);
    });

    return cleanupAudio;
  }, [appState, songData.beatPattern, songData.vocalMelody, songData.bpm, stopPlayback]);


  const renderContent = () => {
    if (isGeneratingText || isGeneratingAudioVideo) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400 text-lg animate-pulse">
            {isGeneratingText ? 'Generating your song draft...' : generationStatus}
          </p>
          <p className="text-gray-500">
             {isGeneratingText ? 'This may take a moment.' : 'Creative work takes time!'}
          </p>
        </div>
      );
    }

    switch (appState) {
      case 'editing':
        return <SongEditor 
                  songData={songData}
                  setSongData={setSongData}
                  onFinalize={handleFinalizeSong}
                  onCancel={handleStartOver}
                  isLoading={isGeneratingAudioVideo}
                />;
      case 'display':
        return (
          <>
            <ArtistProfile 
              title={songData.title}
              artistName={songData.artistName}
              artistBio={songData.artistBio}
              artistVideoUrl={artistVideoUrl}
              lyrics={songData.lyrics}
              styleGuide={songData.styleGuide}
              artistImagePrompt={songData.artistImagePrompt}
              singerGender={songData.singerGender}
              artistType={songData.artistType}
              beatPattern={songData.beatPattern}
              vocalMelody={songData.vocalMelody}
              isPlaying={isPlaying}
              onPlaybackToggle={handlePlaybackToggle}
              bpm={songData.bpm}
              onBpmChange={(newBpm) => setSongData(prev => ({ ...prev, bpm: newBpm }))}
            />

            <MusicVisualizer 
              analyser={audioResources.current.analyser}
              isPlaying={isPlaying}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <LyricsViewer
                lyrics={songData.lyrics}
                currentLineIndex={currentLineIndex}
              />
              <BeatPlayer
                beatPattern={songData.beatPattern}
                isPlaying={isPlaying}
                currentStep={currentBeatStep}
                onRemix={handleRemixBeat}
                isRemixing={isRemixing}
              />
            </div>

            <StyleGuideViewer styleGuide={songData.styleGuide} isLoading={false} />

            <div className="mt-8 text-center">
              <button
                onClick={handleStartOver}
                className="inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300 transform hover:scale-105"
                aria-label="Start over and create a new song"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Start Over
              </button>
            </div>
          </>
        );
      case 'prompt':
      default:
        return (
          <PromptForm
            prompt={prompt}
            setPrompt={setPrompt}
            genre={genre}
            setGenre={setGenre}
            singerGender={singerGender}
            setSingerGender={setSingerGender}
            artistType={artistType}
            setArtistType={setArtistType}
            onGenerate={handleGenerateText}
            isLoading={isGeneratingText}
          />
        );
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          {error && <ErrorMessage message={error} />}
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
