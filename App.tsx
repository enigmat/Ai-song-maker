import React, { useState } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { SongGenerator } from './components/SongGenerator';
import { AifConverter } from './components/AifConverter';
import { Mp3Analyzer } from './components/Mp3Analyzer';
import { SongComparator } from './components/SongComparator';
import { LyricsEnhancer } from './components/LyricsEnhancer';
import { ChordProgressionGenerator } from './components/ChordProgressionGenerator';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'generator' | 'enhancer' | 'chords' | 'converter' | 'analyzer' | 'comparator'>('generator');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <Tabs activeTool={activeTool} onSelectTool={setActiveTool} />
        <main className="mt-8">
          {activeTool === 'generator' && <SongGenerator />}
          {activeTool === 'enhancer' && <LyricsEnhancer />}
          {activeTool === 'chords' && <ChordProgressionGenerator />}
          {activeTool === 'converter' && <AifConverter />}
          {activeTool === 'analyzer' && <Mp3Analyzer />}
          {activeTool === 'comparator' && <SongComparator />}
        </main>
      </div>
    </div>
  );
};

export default App;