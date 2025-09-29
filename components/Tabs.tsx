import React from 'react';

interface TabsProps {
  activeTool: 'generator' | 'enhancer' | 'chords' | 'converter' | 'analyzer' | 'comparator';
  onSelectTool: (tool: 'generator' | 'enhancer' | 'chords' | 'converter' | 'analyzer' | 'comparator') => void;
}

const GeneratorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const EnhancerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const ChordsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" />
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


export const Tabs: React.FC<TabsProps> = ({ activeTool, onSelectTool }) => {
  const getButtonClasses = (tool: 'generator' | 'enhancer' | 'chords' | 'converter' | 'analyzer' | 'comparator') => {
    const isActive = activeTool === tool;
    return `w-full flex items-center justify-center px-4 py-3 font-semibold text-sm sm:text-base rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
      isActive
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  return (
    <div className="mt-8 p-1.5 bg-gray-900/50 rounded-xl border border-gray-700 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-center gap-2">
      <button onClick={() => onSelectTool('generator')} className={getButtonClasses('generator')}>
        <GeneratorIcon />
        Song Generator
      </button>
      <button onClick={() => onSelectTool('enhancer')} className={getButtonClasses('enhancer')}>
        <EnhancerIcon />
        Lyrics Enhancer
      </button>
      <button onClick={() => onSelectTool('chords')} className={getButtonClasses('chords')}>
        <ChordsIcon />
        Chord Progressions
      </button>
      <button onClick={() => onSelectTool('converter')} className={getButtonClasses('converter')}>
        <ConverterIcon />
        Audio Converter
      </button>
      <button onClick={() => onSelectTool('analyzer')} className={getButtonClasses('analyzer')}>
        <AnalyzerIcon />
        MP3 Analyzer
      </button>
      <button onClick={() => onSelectTool('comparator')} className={getButtonClasses('comparator')}>
        <ComparatorIcon />
        Song Comparator
      </button>
    </div>
  );
};