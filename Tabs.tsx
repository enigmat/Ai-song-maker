import React, { useState, useEffect, useRef, useMemo } from 'react';

type ActiveTool = 'generator' | 'artist_generator' | 'album_generator' | 'remixer' | 'vocaltools' | 'vocal_synthesizer' | 'chords' | 'jamsession' | 'converter' | 'release_toolkit' | 'comparator' | 'profiles' | 'dashboard' | 'projects' | 'assistant' | 'style_creator' | 'mastering' | 'song_explorer' | 'youtube_tools' | 'press_release' | 'social_media_kit' | 'sound_pack_generator' | 'bridge_builder' | 'mixdown_analyzer' | 'artist_analyzer' | 'merch_mockup_studio' | 'playlist_pitch_assistant' | 'lyrics_to_video' | 'co_producer';

interface TabsProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onShowRecipe: () => void;
}

// Icon Components
const GeneratorIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg> );
const ArtistGeneratorIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /><path d="M14.5 2a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM16 3.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM17.5 5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5z" /></svg> );
const AlbumIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 10a3 3 0 116 0 3 3 0 01-6 0z" /><path d="M10 11a1 1 0 100-2 1 1 0 000 2z" /></svg> );
const ExplorerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg> );
const ProjectsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg> );
const RemixerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg> );
const VocalToolsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /></svg> );
const VocalSynthIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8h-1a6 6 0 11-12 0H3a7.001 7.001 0 006 6.93V17H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07z" clipRule="evenodd" /><path d="M15.5 2.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM17 4.5a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5zM14 1a.5.5 0 01.5.5v1a.5.5 0 01-1 0v-1a.5.5 0 01.5-.5z" /></svg> );
const ChordsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V4a1 1 0 00-1-1z" /></svg> );
const JamSessionIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.735 2.222a.75.75 0 01.03.03l4.95 4.95a.75.75 0 01-.976 1.134l-1.35-1.157a6.26 6.26 0 00-8.381 8.381l1.157 1.35a.75.75 0 01-1.134.976l-4.95-4.95a.75.75 0 010-1.06l7.65-7.65a.75.75 0 011.03-.027zM11.69 7.72a3.25 3.25 0 10-4.6 4.6 3.25 3.25 0 004.6-4.6z" clipRule="evenodd" /></svg> );
const YouTubeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-8.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L1 12c0-2.19.16-3.8.44-4.83.25.9.83 1.48 1.73 1.73.47-.13 1.33.22 2.65.28 1.3.07 2.49.1 3.59.1L12 5c4.19 0 6.8.16 8.83.44.9.25 1.48.83 1.73 1.73z" /></svg> );
const ProfileIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg> );
const AssistantIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15v1a1 1 0 001 1h12a1 1 0 001-1v-1a1 1 0 00-.293-.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg> );
const StyleCreatorIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg> );
const RecipeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg> );
const ConverterIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5m0-11l-4 4m0 0l-4-4m4 4V4m8 8l4-4m0 0l4 4m-4-4v16" /></svg> );
const AnalyzerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg> );
const ComparatorIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.243c-2.132 0-4.14-.356-6.032-.975m-6.75-.47c-1.01-.143-2.01-.317-3-.52m3 .52l-2.62 10.726c-.122.499.106 1.028.589 1.202a5.988 5.988 0 002.036.243c2.132 0 4.14-.356-6.032-.975" /></svg> );
const MasteringIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h1a1 1 0 011 1v1.5a1.5 1.5 0 010 3V12a1 1 0 00-1 1v1a1 1 0 01-1 1h-1.5a1.5 1.5 0 01-3 0H8a1 1 0 00-1-1v-1a1 1 0 01-1-1v-1.5a1.5 1.5 0 010-3V6a1 1 0 001-1h1a1 1 0 011-1v-.5z" /></svg> );
const DashboardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" /><path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" /></svg> );
const PressReleaseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6a1 1 0 010 2H5a1 1 0 010-2zm0 4h6a1 1 0 010 2H5a1 1 0 010-2zm0 4h6a1 1 0 010 2H5a1 1 0 010-2z" clipRule="evenodd" /><path d="M15 7h1a1 1 0 011 1v5.5a1.5 1.5 0 01-3 0V8a1 1 0 011-1z" /></svg> );
const SocialMediaIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg> );
const SoundPackIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> );
const BridgeBuilderIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v3a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 6a2 2 0 00-2 2v3a2 2 0 002 2h12a2 2 0 002-2v-3a2 2 0 00-2-2H4z" clipRule="evenodd" /></svg>);
const MixdownAnalyzerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15.5 14.5a3.5 3.5 0 11-7 0 3.5 3.5 0 017 0z" /><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /><path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /><path d="M5 5.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /><path d="M10 5a.5.5 0 01.5.5v1.5a.5.5 0 01-1 0V5.5A.5.5 0 0110 5z" /></svg>);
const ArtistAnalyzerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 8c0-1.1.9-2 2-2h3.5a.5.5 0 010 1H5a1 1 0 00-1 1v2a1 1 0 001 1h1.5a.5.5 0 010 1H5a2 2 0 01-2-2V8z" /><path d="M8 6h2v8H8V6z" /><path d="M12.5 6a.5.5 0 01.5-.5H15a2 2 0 012 2v.5a.5.5 0 01-1 0V8a1 1 0 00-1-1h-2a.5.5 0 01-.5-.5z" /><path fillRule="evenodd" d="M13.442 13.024a5.5 5.5 0 10-1.418 1.418l2.663 2.663a1 1 0 001.414-1.414l-2.66-2.66zM11.5 15.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" clipRule="evenodd" /></svg> );
const MerchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg> );
const PitchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg> );
const LyricsToVideoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2 2v2h2V6H4zm4 0v2h2V6H8zm4 0v2h2V6h-2zM4 10v2h2v-2H4zm4 0v2h2v-2H8zm4 0v2h2v-2h-2z" /><path d="M6 14v2h2v-2H6zm4 0v2h2v-2h-2z" /></svg> );
const CoProducerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5z" /><path d="M11 13a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" /></svg> );
const BeatMakerIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6 10a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM9 15a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg> );

const toolList: { id: ActiveTool | 'beat_maker'; label: string; icon: React.ReactElement }[] = [
    { id: 'projects', label: 'Projects', icon: <ProjectsIcon /> },
    { id: 'generator', label: 'Song Generator', icon: <GeneratorIcon /> },
    { id: 'artist_generator', label: 'Artist Generator', icon: <ArtistGeneratorIcon /> },
    { id: 'album_generator', label: 'Album Generator', icon: <AlbumIcon /> },
    { id: 'song_explorer', label: 'Song Explorer', icon: <ExplorerIcon /> },
    { id: 'assistant', label: 'Assistant', icon: <AssistantIcon /> },
    { id: 'co_producer', label: 'Co-Producer', icon: <CoProducerIcon /> },
    { id: 'style_creator', label: 'Style Creator', icon: <StyleCreatorIcon /> },
    { id: 'remixer', label: 'Song Remixer', icon: <RemixerIcon /> },
    { id: 'beat_maker', label: 'Beat Maker', icon: <BeatMakerIcon /> },
    { id: 'sound_pack_generator', label: 'Sound Pack Generator', icon: <SoundPackIcon /> },
    { id: 'social_media_kit', label: 'Social Media Kit', icon: <SocialMediaIcon /> },
    { id: 'merch_mockup_studio', label: 'Merch Mockup Studio', icon: <MerchIcon /> },
    { id: 'youtube_tools', label: 'YouTube Tools', icon: <YouTubeIcon /> },
    { id: 'lyrics_to_video', label: 'Lyrics to Video Prompt', icon: <LyricsToVideoIcon /> },
    { id: 'release_toolkit', label: 'Release Toolkit', icon: <AnalyzerIcon /> },
    { id: 'press_release', label: 'Press Release', icon: <PressReleaseIcon /> },
    { id: 'playlist_pitch_assistant', label: 'Playlist Pitch Assistant', icon: <PitchIcon /> },
    { id: 'jamsession', label: 'Jam Session', icon: <JamSessionIcon /> },
    { id: 'vocaltools', label: 'Vocal Tools', icon: <VocalToolsIcon /> },
    { id: 'vocal_synthesizer', label: 'Vocal Synthesizer', icon: <VocalSynthIcon /> },
    { id: 'chords', label: 'Chord Progressions', icon: <ChordsIcon /> },
    { id: 'bridge_builder', label: 'Bridge Builder', icon: <BridgeBuilderIcon /> },
    { id: 'profiles', label: 'Artist Profiles', icon: <ProfileIcon /> },
    { id: 'mastering', label: 'AI Mastering', icon: <MasteringIcon /> },
    { id: 'mixdown_analyzer', label: 'Mixdown Analyzer', icon: <MixdownAnalyzerIcon /> },
    { id: 'artist_analyzer', label: 'Artist Analyzer', icon: <ArtistAnalyzerIcon /> },
    { id: 'comparator', label: 'Song Comparator', icon: <ComparatorIcon /> },
    { id: 'converter', label: 'Audio Converter', icon: <ConverterIcon /> },
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
];

const coreToolIds: ActiveTool[] = ['projects', 'generator', 'artist_generator', 'co_producer', 'album_generator', 'remixer', 'assistant'];

export const Tabs: React.FC<TabsProps> = ({ activeTool, onSelectTool, onShowRecipe }) => {
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    const { coreTools, otherTools } = useMemo(() => {
        const core = toolList.filter(tool => coreToolIds.includes(tool.id as ActiveTool));
        const other = toolList
            .filter(tool => !coreToolIds.includes(tool.id as ActiveTool))
            .sort((a, b) => a.label.localeCompare(b.label));
        return { coreTools: core, otherTools: other };
    }, []);
    
    const isMoreMenuActive = useMemo(() => {
        return otherTools.some(tool => tool.id === activeTool);
    }, [activeTool, otherTools]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (toolId: ActiveTool) => {
        onSelectTool(toolId);
        setIsMoreMenuOpen(false);
    };

    const TabButton: React.FC<{ tool: { id: ActiveTool | 'beat_maker'; label: string; icon: React.ReactElement }, isActive: boolean }> = ({ tool, isActive }) => (
        <button
            onClick={() => handleSelect(tool.id as ActiveTool)}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
        >
            {tool.icon}
            <span className="hidden sm:inline">{tool.label}</span>
        </button>
    );

    return (
        <nav className="mt-8">
            <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-800/60 border border-gray-700 rounded-lg">
                <button
                    onClick={onShowRecipe}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <RecipeIcon />
                    <span className="hidden sm:inline">Recipe Mode</span>
                </button>
                <div className="w-px h-6 bg-gray-700 mx-1"></div>
                {coreTools.map(tool => (
                    <TabButton key={tool.id} tool={tool} isActive={activeTool === tool.id} />
                ))}

                <div className="relative ml-auto" ref={moreMenuRef}>
                    <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                            isMoreMenuActive
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        <span className="hidden sm:inline">More Tools</span>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {isMoreMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl z-20 max-h-96 flex flex-col animate-fade-in-fast">
                            <div className="overflow-y-auto p-1">
                                {otherTools.map(tool => (
                                    <button
                                        key={tool.id}
                                        onClick={() => handleSelect(tool.id as ActiveTool)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors text-sm rounded-md ${activeTool === tool.id ? 'bg-purple-600/50 text-white font-semibold' : 'text-gray-300 hover:bg-gray-700'}`}
                                    >
                                        <span className={activeTool === tool.id ? 'text-white' : 'text-gray-400'}>{tool.icon}</span>
                                        {tool.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.1s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </nav>
    );
};
