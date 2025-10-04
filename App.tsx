import React, { useState, useMemo } from 'react';
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
import { AIMastering } from './components/AIMastering';
import { UsageDashboard } from './components/UsageDashboard';
import { ProjectManager } from './components/ProjectManager';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AssistantController } from './components/AssistantController';
import { StyleCreator } from './components/StyleCreator';
import { useProjects } from './hooks/useProjects';
import { PlaybackContext } from './contexts/PlaybackContext';

type ActiveTool = 'generator' | 'remixer' | 'vocaltools' | 'chords' | 'converter' | 'analyzer' | 'comparator' | 'splitter' | 'profiles' | 'mastering' | 'dashboard' | 'projects' | 'style_creator';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ActiveTool>('generator');
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const [instrumentalTrackUrl, setInstrumentalTrackUrl] = useState<string | null>(null);
  const [vocalTrack, setVocalTrack] = useState<Blob | null>(null);
  
  // State for PlaybackContext
  const [playbackControls, setPlaybackControls] = useState({
    play: () => {},
    stop: () => {},
    setBpm: (bpm: number) => {},
    isPlaying: false,
  });

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
    <PlaybackContext.Provider value={playbackControls}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans p-4 sm:p-6 md:p-8">
        <OnboardingWizard />
        <div className="max-w-4xl mx-auto">
          <Header />
          <Tabs activeTool={activeTool} onSelectTool={setActiveTool} />
          <main className="mt-8">
            {activeTool === 'generator' && activeProject && (
              <SongGenerator
                key={activeProject.id} // Re-mount component when project changes
                project={activeProject}
                onUpdateProject={updateProject}
                instrumentalTrackUrl={instrumentalTrackUrl}
                clearInstrumentalTrack={clearInstrumentalTrack}
                setPlaybackControls={setPlaybackControls}
              />
            )}
            {activeTool === 'generator' && !activeProject && (
                 <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                    <h2 className="text-2xl font-bold text-gray-300">No Active Project</h2>
                    <p className="mt-2 text-gray-400">Please create a new project or select an existing one to begin.</p>
                     <button
                        onClick={() => setActiveTool('projects')}
                        className="mt-6 inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                    >
                        Go to Projects
                    </button>
                </div>
            )}
            {activeTool === 'projects' && (
              <ProjectManager
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={(id) => {
                  setActiveProjectId(id);
                  setActiveTool('generator');
                }}
                onCreateProject={createProject}
                onDeleteProject={deleteProject}
              />
            )}
            {activeTool === 'remixer' && <SongRemixer />}
            {activeTool === 'vocaltools' && <VocalTools initialVocalTrack={vocalTrack} clearVocalTrack={clearVocalTrack} />}
            {activeTool === 'chords' && <ChordProgressionGenerator />}
            {activeTool === 'style_creator' && <StyleCreator />}
            {activeTool === 'profiles' && <ArtistProfileManager />}
            {activeTool === 'converter' && <AifConverter />}
            {activeTool === 'analyzer' && <Mp3Analyzer />}
            {activeTool === 'comparator' && <SongComparator />}
            {activeTool === 'splitter' && <StemSplitter onInstrumentalSelect={handleInstrumentalSelect} onVocalSelect={handleVocalSelect} />}
            {activeTool === 'mastering' && <AIMastering />}
            {activeTool === 'dashboard' && <UsageDashboard />}
          </main>
        </div>
        <AssistantController />
      </div>
    </PlaybackContext.Provider>
  );
};

export default App;