import React, { useState } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { SongGenerator } from './components/SongGenerator';
import { SongRemixer } from './components/SongRemixer';
import { AifConverter } from './components/AifConverter';
import { Mp3Analyzer } from './components/Mp3Analyzer';
import { SongComparator } from './components/SongComparator';
import { VocalTools } from './components/VocalTools';
import { ChordProgressionGenerator } from './components/ChordProgressionGenerator';
import { StemSplitter } from './components/StemSplitter';
import { ArtistProfileManager } from './components/ArtistProfileManager';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'generator' | 'remixer' | 'vocaltools' | 'chords' | 'converter' | 'analyzer' | 'comparator' | 'splitter' | 'profiles'>('generator');
  const [instrumentalTrackUrl, setInstrumentalTrackUrl] = useState<string | null>(null);
  const [vocalTrack, setVocalTrack] = useState<Blob | null>(null);

  const handleInstrumentalSelect = (blob: Blob) => {
    if (instrumentalTrackUrl) {
      URL.revokeObjectURL(instrumentalTrackUrl);
    }
    const newUrl = URL.createObjectURL(blob);
    setInstrumentalTrackUrl(newUrl);
    setVocalTrack(null);
    setActiveTool('generator');
  };

  const handleVocalSelect = (blob: Blob) => {
    setVocalTrack(blob);
    clearInstrumentalTrack();
    setActiveTool('vocaltools');
  };

  const clearVocalTrack = () => {
    setVocalTrack(null);
  };

  const clearInstrumentalTrack = () => {
    if (instrumentalTrackUrl) {
      URL.revokeObjectURL(instrumentalTrackUrl);
    }
    setInstrumentalTrackUrl(null);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <Tabs activeTool={activeTool} onSelectTool={setActiveTool} />
        <main className="mt-8">
          {activeTool === 'generator' && <SongGenerator instrumentalTrackUrl={instrumentalTrackUrl} clearInstrumentalTrack={clearInstrumentalTrack} />}
          {activeTool === 'remixer' && <SongRemixer />}
          {activeTool === 'vocaltools' && <VocalTools initialVocalTrack={vocalTrack} clearVocalTrack={clearVocalTrack} />}
          {activeTool === 'chords' && <ChordProgressionGenerator />}
          {activeTool === 'profiles' && <ArtistProfileManager />}
          {activeTool === 'converter' && <AifConverter />}
          {activeTool === 'analyzer' && <Mp3Analyzer />}
          {activeTool === 'comparator' && <SongComparator />}
          {activeTool === 'splitter' && <StemSplitter onInstrumentalSelect={handleInstrumentalSelect} onVocalSelect={handleVocalSelect} />}
        </main>
      </div>
    </div>
  );
};

export default App;