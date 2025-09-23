import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PromptForm } from './components/PromptForm';
import { LyricsViewer } from './components/LyricsViewer';
import { StyleGuideViewer } from './components/StyleGuideViewer';
import { ErrorMessage } from './components/ErrorMessage';
import { ArtistProfile } from './components/ArtistProfile';
import { SongEditor } from './components/SongEditor';
import { generateSong, generateArtistImage } from './services/geminiService';
import { LoadingSpinner } from './components/LoadingSpinner';

export type SingerGender = 'Female' | 'Male';
export type ArtistType = 'Solo Artist' | 'Group';

interface SongData {
  title: string;
  artistName: string;
  artistBio: string;
  artistImagePrompt: string;
  lyrics: string;
  styleGuide: string;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [genre, setGenre] = useState<string>('Pop');
  const [singerGender, setSingerGender] = useState<SingerGender>('Female');
  const [artistType, setArtistType] = useState<ArtistType>('Solo Artist');
  
  const [appState, setAppState] = useState<'prompt' | 'editing' | 'display'>('prompt');
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  
  const [songData, setSongData] = useState<SongData>({
    title: '',
    artistName: '',
    artistBio: '',
    artistImagePrompt: '',
    lyrics: '',
    styleGuide: '',
  });
  const [artistImageUrl, setArtistImageUrl] = useState<string>('');

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
                      artistImagePrompt: '', // Not shared
                    });
                    setArtistImageUrl(loadedSong.artistImageUrl || '');
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
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();
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
      setSongData(generatedData);
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
    setIsGeneratingImage(true);
    setError(null);

    try {
      const imageUrl = await generateArtistImage(songData.artistImagePrompt);
      setArtistImageUrl(imageUrl);
      setAppState('display');
    } catch (err) {
      console.error(err);
      setError('Failed to generate the artist image. Please check the console and try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };


  const handlePlaySong = useCallback(() => {
    if (isPlaying) {
      stopSpeech();
      return;
    }

    const allLines = songData.lyrics.split('\n');
    const speakableLines = allLines
      .map((line, index) => ({ line, originalIndex: index }))
      .filter(item => item.line.trim() !== '' && !/^\s*\[.*\]\s*$/.test(item.line));

    if (speakableLines.length === 0) return;
    
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    let selectedVoice: SpeechSynthesisVoice | null = null;

    if (englishVoices.length > 0) {
        let preferredVoices: SpeechSynthesisVoice[] = [];
        if (singerGender === 'Female') {
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

      const currentLine = speakableLines[lineIndex];
      setCurrentLineIndex(currentLine.originalIndex);
      
      const utterance = new SpeechSynthesisUtterance(currentLine.line);
      utterance.rate = 0.9;
      utterance.pitch = singerGender === 'Female' ? 1.1 : 0.9;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
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

    speakLine();
  }, [songData.lyrics, isPlaying, stopSpeech, voices, singerGender]);
  
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);


  const renderContent = () => {
    if (isGeneratingText) {
      return (
        <div className="text-center p-10 bg-gray-800/50 rounded-xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-400 text-lg">Generating your song draft...</p>
          <p className="text-gray-500">This may take a moment.</p>
        </div>
      );
    }

    switch (appState) {
      case 'editing':
        return <SongEditor 
                  songData={songData}
                  setSongData={setSongData}
                  onFinalize={handleFinalizeSong}
                  isLoading={isGeneratingImage}
                />;
      case 'display':
        return (
          <>
            <ArtistProfile 
              title={songData.title}
              artistName={songData.artistName}
              artistBio={songData.artistBio}
              artistImageUrl={artistImageUrl}
              lyrics={songData.lyrics}
              styleGuide={songData.styleGuide}
            />
            
            <LyricsViewer
              lyrics={songData.lyrics}
              isLoading={false}
              isPlaying={isPlaying}
              currentLineIndex={currentLineIndex}
              onPlayToggle={handlePlaySong}
            />
            <StyleGuideViewer styleGuide={songData.styleGuide} isLoading={false} />
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
