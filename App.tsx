import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { LyricsViewer } from './components/LyricsViewer';
import { StyleGuideViewer } from './components/StyleGuideViewer';
import { ErrorMessage } from './components/ErrorMessage';
import { ArtistProfile } from './components/ArtistProfile';
import { SongEditor } from './components/SongEditor';
import { generateSong, generateArtistVideo } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';

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
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('Pop');
  const [singerGender, setSingerGender] = useState<SingerGender>('Female');
  const [artistType, setArtistType] = useState<ArtistType>('Solo Artist');
  
  const [appState, setAppState] = useState<'prompt' | 'editing' | 'display'>('prompt');
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
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
  });
  const [artistVideoUrl, setArtistVideoUrl] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const isPlayingRef = useRef(isPlaying);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  
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
                      singerGender: loadedSong.singerGender || (loadedSong.artistType === 'Duet' ? 'Female' : 'Female'), // Default singer for duets/solo
                      artistType: loadedSong.artistType || 'Solo Artist',
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

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
        setError("Your browser does not support speech synthesis. The play feature will be unavailable.");
    } else {
        const loadVoices = () => {
          setVoices(window.speechSynthesis.getVoices());
        };
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        loadVoices();
    }
  }, []);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentLineIndex(-1);
  }, []);

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a song idea.');
      return;
    }
    setIsGeneratingText(true);
    setError(null);
    stopSpeech();

    try {
      const generatedData = await generateSong(prompt, genre, artistType);
      setSongData({
        ...generatedData,
        singerGender: singerGender,
        artistType: artistType,
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
    setIsGeneratingVideo(true);
    setError(null);

    const messages = [
        "Warming up the video cameras...",
        "Setting the scene...",
        "Directing your artist...",
        "Rolling camera... Action!",
        "Rendering the final cut...",
        "This can take a few minutes...",
    ];
    let messageIndex = 0;
    setGenerationStatus(messages[messageIndex]);
    const intervalId = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setGenerationStatus(messages[messageIndex]);
    }, 4000);


    try {
      const videoUrl = await generateArtistVideo(songData.artistImagePrompt);
      setArtistVideoUrl(videoUrl);
      setAppState('display');
    } catch (err) {
      console.error(err);
      setError('Failed to generate the artist video. Please check the console and try again.');
       // Go back to editing on failure
       setAppState('editing');
    } finally {
      setIsGeneratingVideo(false);
      clearInterval(intervalId);
      setGenerationStatus('');
    }
  };


  const handlePlaySong = useCallback(() => {
    if (isPlaying) {
      stopSpeech();
      return;
    }

    if (!('speechSynthesis' in window) || voices.length === 0) {
        setError("No speech voices are available on your browser or device. Cannot play song.");
        return;
    }

    const allLines = songData.lyrics.split('\n');
    const speakableLines = allLines
      .map((line, index) => ({ line, originalIndex: index }))
      .filter(item => item.line.trim() !== '' && !/^\s*\[.*\]\s*$/.test(item.line));

    if (speakableLines.length === 0) return;
    
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    if (englishVoices.length === 0) {
        setError("No English voices found for playback.");
        return;
    }

    let selectedVoice: SpeechSynthesisVoice | null = null;
    let maleVoice: SpeechSynthesisVoice | null = null;
    let femaleVoice: SpeechSynthesisVoice | null = null;

    if (songData.artistType === 'Duet') {
        const preferredFemale = englishVoices.filter(v => v.name.toLowerCase().includes('female'));
        femaleVoice = preferredFemale.length > 0 ? preferredFemale[0] : englishVoices.find(v => !v.name.toLowerCase().includes('male')) || englishVoices[0];
        
        const preferredMale = englishVoices.filter(v => v.name.toLowerCase().includes('male'));
        maleVoice = preferredMale.length > 0 ? preferredMale[0] : englishVoices.find(v => !v.name.toLowerCase().includes('female')) || englishVoices[0];

        if (!maleVoice || !femaleVoice) {
            setError("Could not find suitable male and female voices for a duet.");
            return;
        }
    } else {
        let preferredVoices: SpeechSynthesisVoice[] = [];
        if (songData.singerGender === 'Female') {
            preferredVoices = englishVoices.filter(v => v.name.toLowerCase().includes('female'));
            if (preferredVoices.length === 0) {
                preferredVoices = englishVoices.filter(v => !v.name.toLowerCase().includes('male'));
            }
        } else { // Male
            preferredVoices = englishVoices.filter(v => v.name.toLowerCase().includes('male'));
            if (preferredVoices.length === 0) {
                preferredVoices = englishVoices.filter(v => !v.name.toLowerCase().includes('female'));
            }
        }

        if (preferredVoices.length > 0) {
            selectedVoice = preferredVoices[Math.floor(Math.random() * preferredVoices.length)];
        } else {
            selectedVoice = englishVoices[Math.floor(Math.random() * englishVoices.length)];
        }
    }


    setIsPlaying(true);
    let lineIndex = 0;

    const speakLine = () => {
      if (!isPlayingRef.current || lineIndex >= speakableLines.length) {
        stopSpeech();
        return;
      }

      const currentItem = speakableLines[lineIndex];
      setCurrentLineIndex(currentItem.originalIndex);
      
      let lineText = currentItem.line;
      let voiceForLine: SpeechSynthesisVoice | null = selectedVoice;

      if (songData.artistType === 'Duet') {
          if (lineText.toLowerCase().includes('(singer 1)')) {
              voiceForLine = femaleVoice;
          } else if (lineText.toLowerCase().includes('(singer 2)')) {
              voiceForLine = maleVoice;
          } else {
              voiceForLine = femaleVoice; // Default for (Both) or unmarked lines
          }
          lineText = lineText.replace(/\((singer 1|singer 2|both)\)/i, '').trim();
      }

      if (!lineText) { // If line is empty after stripping markers
          lineIndex++;
          speakLine();
          return;
      }
      
      const utterance = new SpeechSynthesisUtterance(lineText);
      utterance.rate = 0.9;
      
      if (voiceForLine) {
          const isFemale = voiceForLine.name.toLowerCase().includes('female');
          const basePitch = isFemale ? 1.2 : 0.8;
          utterance.pitch = basePitch + (Math.random() * 0.2 - 0.1);
          utterance.voice = voiceForLine;
      } else {
          // Fallback for non-duet case if voice not found
          const basePitch = songData.singerGender === 'Female' ? 1.2 : 0.8;
          utterance.pitch = basePitch + (Math.random() * 0.2 - 0.1);
      }
      
      utterance.onend = () => {
        lineIndex++;
        speakLine();
      };
      
      utterance.onerror = (event) => {
        console.error('SpeechSynthesisUtterance.onerror', event);
        setError('An error occurred during speech playback. Your browser might not support this feature.');
        stopSpeech();
      };

      window.speechSynthesis.speak(utterance);
    };

    setTimeout(speakLine, 100);
  }, [songData, isPlaying, stopSpeech, voices]);
  
  const handleStartOver = useCallback(() => {
    stopSpeech();
    setAppState('prompt');
    setPrompt('');
    // Reset to defaults
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
    });
    setArtistVideoUrl('');
    setError(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [stopSpeech]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);


  const renderContent = () => {
    if (isGeneratingText || isGeneratingVideo) {
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
                  isLoading={isGeneratingVideo}
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
            />
            
            <LyricsViewer
              lyrics={songData.lyrics}
              isLoading={false}
              isPlaying={isPlaying}
              currentLineIndex={currentLineIndex}
              onPlayToggle={handlePlaySong}
              isPlayable={'speechSynthesis' in window && voices.length > 0}
            />
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
