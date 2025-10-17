import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { Tabs } from './components/Tabs';
import { SongGenerator } from './components/SongGenerator';
import { AlbumGenerator } from './components/AlbumGenerator';
import { SongRemixer } from './components/SongRemixer';
import { AifConverter } from './components/AifConverter';
import { ReleaseToolkit } from './components/ReleaseToolkit';
import { SongComparator } from './components/SongComparator';
import { VocalTools } from './components/VocalTools';
import { ChordProgressionGenerator } from './components/ChordProgressionGenerator';
import { JamSession } from './components/JamSession';
import { ArtistProfileManager } from './components/ArtistProfileManager';
import { UsageDashboard } from './components/UsageDashboard';
import { ProjectManager } from './components/ProjectManager';
import { OnboardingWizard } from './components/OnboardingWizard';
import { AssistantController } from './components/AssistantController';
import { StudioAssistant } from './components/StudioAssistant';
import { StyleCreator } from './components/StyleCreator';
import { ArtistGenerator } from './components/ArtistGenerator';
import { AIMastering } from './components/AIMastering';
import { useProjects } from './hooks/useProjects';
import { PlaybackContext } from './contexts/PlaybackContext';
import { SongExplorer } from './components/SongExplorer';
import { YouTubeTools } from './components/YouTubeTools';
import { PressReleaseGenerator } from './components/PressReleaseGenerator';
import { SocialMediaKitGenerator } from './components/SocialMediaKitGenerator';
import { SoundPackGenerator } from './components/SoundPackGenerator';


type ActiveTool = 'generator' | 'artist_generator' | 'album_generator' | 'remixer' | 'vocaltools' | 'chords' | 'jamsession' | 'converter' | 'release_toolkit' | 'comparator' | 'profiles' | 'dashboard' | 'projects' | 'assistant' | 'style_creator' | 'mastering' | 'song_explorer' | 'youtube_tools' | 'press_release' | 'social_media_kit' | 'sound_pack_generator';
const ONBOARDING_KEY = 'mustbmusic_onboarding_complete_v1';

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
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
        const hasCompleted = localStorage.getItem(ONBOARDING_KEY);
        if (!hasCompleted) {
            setShowOnboarding(true);
        }
    } catch (e) {
        console.error("Could not access local storage for onboarding.", e);
    }
  }, []);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);
  
  // State for PlaybackContext
  const [playbackControls, setPlaybackControls] = useState({
    play: () => {},
    stop: () => {},
    setBpm: (bpm: number) => {},
    isPlaying: false,
  });

  return (
    <PlaybackContext.Provider value={playbackControls}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans p-4 sm:p-6 md:p-8">
        <OnboardingWizard isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        <div className="max-w-4xl mx-auto">
          <Header />
          <Tabs activeTool={activeTool} onSelectTool={setActiveTool} onShowRecipe={() => setShowOnboarding(true)} />
          <main className="mt-8">
            {activeTool === 'generator' && activeProject && (
              <SongGenerator
                key={activeProject.id} // Re-mount component when project changes
                project={activeProject}
                onUpdateProject={updateProject}
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
            {activeTool === 'artist_generator' && <ArtistGenerator />}
            {activeTool === 'album_generator' && <AlbumGenerator />}
            {activeTool === 'song_explorer' && <SongExplorer />}
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
            {activeTool === 'sound_pack_generator' && <SoundPackGenerator />}
            {activeTool === 'youtube_tools' && <YouTubeTools />}
            {activeTool === 'release_toolkit' && <ReleaseToolkit />}
            {activeTool === 'press_release' && <PressReleaseGenerator />}
            {activeTool === 'social_media_kit' && <SocialMediaKitGenerator />}
            {activeTool === 'vocaltools' && <VocalTools />}
            {activeTool === 'chords' && <ChordProgressionGenerator />}
            {activeTool === 'jamsession' && <JamSession />}
            {activeTool === 'assistant' && <StudioAssistant />}
            {activeTool === 'style_creator' && <StyleCreator />}
            {activeTool === 'profiles' && <ArtistProfileManager />}
            {activeTool === 'converter' && <AifConverter />}
            {activeTool === 'comparator' && <SongComparator />}
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