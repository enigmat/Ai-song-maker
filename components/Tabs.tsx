import React from 'react';

type ActiveTool = 'generator' | 'album_generator' | 'remixer' | 'vocaltools' | 'chords' | 'jamsession' | 'converter' | 'analyzer' | 'comparator' | 'profiles' | 'dashboard' | 'projects' | 'assistant' | 'style_creator' | 'mastering';

interface TabsProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onShowRecipe: () => void;
}

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const AlbumIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 10a3 3 0 116 0 3 3 0 01-6 0z" />
      <path d="M10 11a1 1 0 100-2 1 1 0 000 2z" />
    </svg>
);

const ProjectsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
);


const RemixerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const VocalToolsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" />
    </svg>
);

const ChordsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
    </svg>
);

const JamSessionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M14.735 2.222a.75.75 0 01.03.03l4.95 4.95a.75.75 0 01-.976 1.134l-1.35-1.157a6.26 6.26 0 00-8.381 8.381l1.157 1.35a.75.75 0 01-1.134.976l-4.95-4.95a.75.75 0 010-1.06l7.65-7.65a.75.75 0 011.03-.027zM11.69 7.72a3.25 3.25 0 10-4.6 4.6 3.25 3.25 0 004.6-4.6z" clipRule="evenodd" />
    </svg>
);

const ProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const AssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
    </svg>
);

const StyleCreatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const RecipeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
);

const ConverterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5m0-11l-4 4m0 0l-4-4m4 4V4m8 8l4-4m0 0l4 4m-4-4v16" />
    </svg>
);

const AnalyzerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
);

const ComparatorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.243c-2.132 0-4.14-.356-6.032-.975m-6.75-.47c-1.01-.143-2.01-.317-3-.52m3 .52l-2.62 10.726c-.122.499.106 1.028.589 1.202a5.988 5.988 0 002.036.243c2.132 0 4.14-.356 6.032-.975" />
    </svg>
);

const MasteringIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v1.5a1.5 1.5 0 010 3V12a1 1 0 00-1 1v1a1 1 0 01-1 1h-1.5a1.5 1.5 0 01-3 0H8a1 1 0 00-1-1v-1a1 1 0 01-1-1v-1.5a1.5 1.5 0 010-3V6a1 1 0 001-1h1a1 1 0 011-1v-.5z" />
    </svg>
);

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
    </svg>
);

export const Tabs: React.FC<TabsProps> = ({ activeTool, onSelectTool, onShowRecipe }) => {
  const getButtonClasses = (tool: ActiveTool) => {
    const isActive = activeTool === tool;
    return `w-full flex items-center justify-center px-4 py-3 font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  const nonActiveClasses = 'w-full flex items-center justify-center px-4 py-3 font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white';

  return (
    <div className="mt-8 p-1.5 bg-gray-900/50 rounded-xl border border-gray-700 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 items-center gap-2">
      <button onClick={() => onSelectTool('projects')} className={getButtonClasses('projects')}>
        <ProjectsIcon />
        Projects
      </button>
      <button onClick={() => onSelectTool('generator')} className={getButtonClasses('generator')}>
        <GeneratorIcon />
        Song Generator
      </button>
      <button onClick={() => onSelectTool('album_generator')} className={getButtonClasses('album_generator')}>
        <AlbumIcon />
        Album Generator
      </button>
       <button onClick={() => onSelectTool('assistant')} className={getButtonClasses('assistant')}>
        <AssistantIcon />
        Assistant
      </button>
      <button onClick={() => onSelectTool('style_creator')} className={getButtonClasses('style_creator')}>
        <StyleCreatorIcon />
        Style Creator
      </button>
      <button onClick={() => onSelectTool('remixer')} className={getButtonClasses('remixer')}>
        <RemixerIcon />
        Song Remixer
      </button>
      <button onClick={() => onSelectTool('jamsession')} className={getButtonClasses('jamsession')}>
        <JamSessionIcon />
        Jam Session
      </button>
      <button onClick={() => onSelectTool('vocaltools')} className={getButtonClasses('vocaltools')}>
        <VocalToolsIcon />
        Vocal Tools
      </button>
      <button onClick={() => onSelectTool('chords')} className={getButtonClasses('chords')}>
        <ChordsIcon />
        Chord Progressions
      </button>
      <button onClick={() => onSelectTool('profiles')} className={getButtonClasses('profiles')}>
        <ProfileIcon />
        Artist Profiles
      </button>
      <button onClick={() => onSelectTool('mastering')} className={getButtonClasses('mastering')}>
        <MasteringIcon />
        AI Mastering
      </button>
      <button onClick={() => onSelectTool('analyzer')} className={getButtonClasses('analyzer')}>
        <AnalyzerIcon />
        MP3 Analyzer
      </button>
      <button onClick={() => onSelectTool('comparator')} className={getButtonClasses('comparator')}>
        <ComparatorIcon />
        Song Comparator
      </button>
       <button onClick={() => onSelectTool('converter')} className={getButtonClasses('converter')}>
        <ConverterIcon />
        Audio Converter
      </button>
      <button onClick={() => onSelectTool('dashboard')} className={getButtonClasses('dashboard')}>
        <DashboardIcon />
        Dashboard
      </button>
       <button onClick={onShowRecipe} className={nonActiveClasses}>
        <RecipeIcon />
        Recipe Mode
      </button>
    </div>
  );
};
