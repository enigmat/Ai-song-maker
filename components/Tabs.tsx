import React from 'react';

interface TabsProps {
  activeTool: 'generator' | 'vocaltools' | 'chords' | 'converter' | 'analyzer' | 'comparator' | 'remixer' | 'splitter' | 'profiles' | 'mastering' | 'dashboard';
  onSelectTool: (tool: 'generator' | 'vocaltools' | 'chords' | 'converter' | 'analyzer' | 'comparator' | 'remixer' | 'splitter' | 'profiles' | 'mastering' | 'dashboard') => void;
}

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

const ProfileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
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

const SplitterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.293 3.293a1 1 0 011.414 1.414l-13 13A1 1 0 014 18H3a1 1 0 01-1-1v-1a1 1 0 01.293-.707l13-13zM10 4a1 1 0 10-2 0v1.586l-1.293-1.293a1 1 0 00-1.414 1.414L6.586 7 5.293 8.293a1 1 0 001.414 1.414L8 8.414v1.586a1 1 0 102 0v-1.586l1.293 1.293a1 1 0 001.414-1.414L11.414 7l1.293-1.293a1 1 0 00-1.414-1.414L10 5.586V4z" />
        <path d="M16 4a2 2 0 11-4 0 2 2 0 014 0zM6 14a2 2 0 11-4 0 2 2 0 014 0z" />
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


export const Tabs: React.FC<TabsProps> = ({ activeTool, onSelectTool }) => {
  const getButtonClasses = (tool: 'generator' | 'vocaltools' | 'chords' | 'converter' | 'analyzer' | 'comparator' | 'remixer' | 'splitter' | 'profiles' | 'mastering' | 'dashboard') => {
    const isActive = activeTool === tool;
    return `w-full flex items-center justify-center px-4 py-3 font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  return (
    <div className="mt-8 p-1.5 bg-gray-900/50 rounded-xl border border-gray-700 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 items-center gap-2">
      <button onClick={() => onSelectTool('generator')} className={getButtonClasses('generator')}>
        <GeneratorIcon />
        Song Generator
      </button>
      <button onClick={() => onSelectTool('remixer')} className={getButtonClasses('remixer')}>
        <RemixerIcon />
        Song Remixer
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
      <button onClick={() => onSelectTool('splitter')} className={getButtonClasses('splitter')}>
        <SplitterIcon />
        Stem Splitter
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
        Usage Dashboard
      </button>
    </div>
  );
};