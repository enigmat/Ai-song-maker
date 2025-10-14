import React, { useState, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';
import { analyzeSong, generateRolloutPlan, generateListenerProfile, generateContentIdeas } from '../services/geminiService';
import type { AnalysisReport, RolloutPlan, ListenerProfile, ListenerProfileSection } from '../types';
import { ReportViewer } from './ReportViewer';

declare var saveAs: any;

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RolloutPlannerDisplay: React.FC<{ plan: RolloutPlan }> = ({ plan }) => (
    <div className="space-y-8 animate-fade-in">
        <div>
            <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-purple-500/50 pb-2">Release Timeline</h3>
            <div className="relative pl-4 border-l-2 border-gray-700 space-y-8">
                {plan.rollout.map((timeframe, index) => (
                    <div key={index} className="relative">
                        <div className="absolute -left-6 -top-1 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {plan.rollout.length - index}
                        </div>
                        <h4 className="text-xl font-semibold text-purple-400 mb-3 ml-6">{timeframe.timeframe}</h4>
                        <div className="space-y-3 ml-6">
                            {timeframe.tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
                                    <p className="font-semibold text-gray-200">{task.task}</p>
                                    <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-teal-500/50 pb-2">Social Media Content Ideas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {plan.socialMediaContent.map((platform, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-lg font-semibold text-teal-400 mb-3">{platform.platform}</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                            {platform.ideas.map((idea, ideaIndex) => <li key={ideaIndex}>{idea}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-gray-200 mb-4 border-b-2 border-pink-500/50 pb-2">Email Newsletter Snippets</h3>
            <div className="space-y-4">
                {plan.emailSnippets.map((email, index) => (
                    <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        <p className="text-sm font-bold text-pink-400">Subject: <span className="font-normal text-gray-200">{email.subject}</span></p>
                        <div className="mt-3 pt-3 border-t border-gray-700/50 whitespace-pre-wrap font-sans text-sm text-gray-300">
                            {email.body}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const DemographicsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> );
const PsychographicsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> );
const MusicHabitsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" /></svg> );

const icons = {
  Demographics: <DemographicsIcon />,
  Psychographics: <PsychographicsIcon />,
  "Music Habits": <MusicHabitsIcon />,
};

const ListenerProfileDisplay: React.FC<{ profile: ListenerProfile; onDownload: () => void; }> = ({ profile, onDownload }) => {
    const sections = [profile.demographics, profile.psychographics, profile.musicHabits];

    return (
        <div className="bg-[#0D1A26] text-white p-6 sm:p-8 md:p-12 rounded-lg font-sans relative">
            <h1 className="text-4xl sm:text-5xl font-bold text-center text-white">
                {profile.archetypeName}
            </h1>
            <p className="mt-4 text-center text-lg text-gray-300 max-w-3xl mx-auto">
                {profile.description}
            </p>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map(section => (
                    <div key={section.title} className="bg-[#1A2C3A] p-6 rounded-lg border border-teal-500/20">
                        <h3 className="flex items-center gap-3 text-xl font-bold text-white mb-4">
                            <span className="text-teal-300">{icons[section.title as keyof typeof icons]}</span>
                            {section.title}
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            {section.details.map((item, index) => (
                                <li key={index} className="flex">
                                    <span className="text-teal-300 mr-2">-</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <button
                onClick={onDownload}
                className="absolute bottom-4 right-4 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-500 transition-colors"
            >
                Download
            </button>
        </div>
    );
};


export const ReleaseToolkit: React.FC = () => {
    const [step, setStep] = useState<'form' | 'generatingInitial' | 'ideaSelection' | 'generatingFinal' | 'success' | 'error'>('form');
    const [file, setFile] = useState<File | null>(null);
    const [artistName, setArtistName] = useState('');
    const [artistType, setArtistType] = useState('Recording Artist');
    const [releaseDate, setReleaseDate] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    
    const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
    const [rolloutPlan, setRolloutPlan] = useState<RolloutPlan | null>(null);
    const [listenerProfile, setListenerProfile] = useState<ListenerProfile | null>(null);
    const [contentIdeas, setContentIdeas] = useState<string[]>([]);
    const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
    
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const [activeTab, setActiveTab] = useState<'listener' | 'analysis' | 'plan'>('listener');

    const handleFileSelect = (selectedFile: File | null) => {
        if (selectedFile) {
            if (!selectedFile.type.startsWith('audio/mpeg') && !selectedFile.name.toLowerCase().endsWith('.mp3')) {
                setError('Please select a valid MP3 audio file.');
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    };
    
    const handleGenerateInitial = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!file || !artistName.trim() || !targetAudience.trim()) {
            setError('Please select a file and fill out all required fields.');
            return;
        }
        
        setStep('generatingInitial');
        setError(null);
        try {
            setProcessingStep('Generating content ideas & initial analysis...');
            const [report, profile, ideas] = await Promise.all([
                analyzeSong(file.name, artistName, artistType, targetAudience),
                generateListenerProfile(artistName, artistType, file.name, targetAudience),
                generateContentIdeas(file.name, artistName, artistType, targetAudience)
            ]);

            setAnalysisReport(report);
            setListenerProfile(profile);
            setContentIdeas(ideas);
            setStep('ideaSelection');

        } catch (err) {
            console.error('Initial generation failed:', err);
            setError('Failed to generate initial data. The AI model may be overloaded. Please try again.');
            setStep('error');
        }
    };
    
    const handleIdeaSelection = (idea: string, isSelected: boolean) => {
        setSelectedIdeas(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(idea);
            } else {
                newSet.delete(idea);
            }
            return newSet;
        });
    };
    
    const handleGenerateFinalPlan = async () => {
        if (selectedIdeas.size === 0) return;
        setStep('generatingFinal');
        try {
            const plan = await generateRolloutPlan(file!.name, artistName, artistType, releaseDate, targetAudience, Array.from(selectedIdeas));
            setRolloutPlan(plan);
            setStep('success');
        } catch (err) {
             console.error('Final plan generation failed:', err);
            setError('Failed to generate the final rollout plan. Please try again.');
            setStep('error');
        }
    };


    const handleReset = useCallback(() => {
        setStep('form');
        setFile(null);
        setArtistName('');
        setArtistType('Recording Artist');
        setReleaseDate('');
        setTargetAudience('');
        setAnalysisReport(null);
        setRolloutPlan(null);
        setListenerProfile(null);
        setContentIdeas([]);
        setSelectedIdeas(new Set());
        setError(null);
        setProcessingStep('');
        setActiveTab('listener');
    }, []);

    const renderContent = () => {
        switch (step) {
            case 'generatingInitial':
            case 'generatingFinal':
                return (
                    <div className="text-center p-10 bg-gray-800/50 rounded-xl">
                        <LoadingSpinner size="lg" />
                        <p className="mt-4 text-gray-400 text-lg animate-pulse">
                            {step === 'generatingInitial' ? 'Generating ideas & analysis...' : 'Building your personalized plan...'}
                        </p>
                    </div>
                );

            case 'ideaSelection':
                return (
                    <div className="p-4 sm:p-6 animate-fade-in text-white">
                        <h2 className="text-3xl font-bold text-center">Your Custom Content Ideas</h2>
                        <p className="text-center text-gray-400 mt-2 mb-8">Here are 20 content ideas tailored for you. Select your favorites, and we'll weave them into your personalized rollout plan.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl mx-auto">
                            {contentIdeas.map((idea, index) => (
                                <label key={index} className="flex items-start p-4 bg-gray-800/50 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-1 h-5 w-5 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500"
                                        onChange={(e) => handleIdeaSelection(idea, e.target.checked)}
                                    />
                                    <span className="ml-4 text-gray-300">{idea}</span>
                                </label>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <button
                                onClick={handleGenerateFinalPlan}
                                disabled={selectedIdeas.size === 0}
                                className="inline-flex items-center justify-center gap-3 text-lg font-semibold px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {`Weave ${selectedIdeas.size} Idea${selectedIdeas.size !== 1 ? 's' : ''} into My Plan`}
                            </button>
                        </div>
                    </div>
                );

            case 'success':
                 const handleDownloadProfile = () => {
                    if (!listenerProfile) return;
                    let content = `${listenerProfile.archetypeName}\n\n${listenerProfile.description}\n\n`;
                    
                    const formatSection = (section: ListenerProfileSection) => {
                        let sectionContent = `--- ${section.title} ---\n`;
                        section.details.forEach((item: string) => { sectionContent += `- ${item}\n`; });
                        return sectionContent + '\n';
                    };

                    content += formatSection(listenerProfile.demographics);
                    content += formatSection(listenerProfile.psychographics);
                    content += formatSection(listenerProfile.musicHabits);

                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    saveAs(blob, `ideal_listener_${listenerProfile.archetypeName.replace(/\s/g, '_')}.txt`);
                };

                return (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">
                            Release Toolkit Results
                        </h2>
                        <p className="text-center text-gray-400 mt-1 mb-6 break-words">For: <span className="font-semibold text-gray-300">{file?.name}</span></p>

                        <div className="flex justify-center mb-6">
                            <div className="flex items-center gap-1 rounded-lg bg-gray-900 p-1 border border-gray-700">
                                <button onClick={() => setActiveTab('listener')} aria-pressed={activeTab === 'listener'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'listener' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Ideal Listener</button>
                                <button onClick={() => setActiveTab('analysis')} aria-pressed={activeTab === 'analysis'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'analysis' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>A&R Report</button>
                                <button onClick={() => setActiveTab('plan')} aria-pressed={activeTab === 'plan'} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'plan' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Rollout Plan</button>
                            </div>
                        </div>
                        
                        {activeTab === 'analysis' && analysisReport && <ReportViewer report={analysisReport} fileName={file?.name || 'track'} onClose={() => setActiveTab('listener')} />}
                        {activeTab === 'listener' && listenerProfile && <ListenerProfileDisplay profile={listenerProfile} onDownload={handleDownloadProfile} />}
                        {activeTab === 'plan' && rolloutPlan && <RolloutPlannerDisplay plan={rolloutPlan} />}

                        <div className="text-center mt-8">
                            <button onClick={handleReset} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-gray-600 text-gray-300 rounded-lg shadow-md hover:bg-gray-700 hover:text-white transition-all duration-300">
                                Start Over
                            </button>
                        </div>
                    </div>
                );
            case 'error':
            case 'form':
            default:
                return (
                    <form onSubmit={handleGenerateInitial} className="space-y-4">
                        <div
                            onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                            className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
                            onClick={() => document.getElementById('toolkit-file-input')?.click()}
                        >
                            <input id="toolkit-file-input" type="file" accept=".mp3,audio/mpeg" onChange={handleFileChange} className="hidden" />
                            <div className="text-center">
                                <UploadIcon />
                                {file ? (
                                    <p className="mt-2 text-lg font-semibold text-teal-400 truncate" title={file.name}>{file.name}</p>
                                ) : (
                                    <p className="mt-2 text-lg font-semibold text-gray-300">Drag & Drop your MP3 file here</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="artist-name" className="block text-sm font-medium text-gray-400 mb-2">What is your artist, producer, or DJ name?</label>
                                <input id="artist-name" type="text" value={artistName} onChange={e => setArtistName(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'Starlight Velocity'" />
                            </div>
                            <div>
                                <label htmlFor="artist-type" className="block text-sm font-medium text-gray-400 mb-2">What best describes you?</label>
                                <select id="artist-type" value={artistType} onChange={e => setArtistType(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500">
                                    {['Recording Artist', 'Band', 'Producer', 'DJ'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="release-date" className="block text-sm font-medium text-gray-400 mb-2">When is your planned release date? (Optional)</label>
                            <input id="release-date" type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label htmlFor="target-audience" className="block text-sm font-medium text-gray-400 mb-2">Describe your target audience. (Your ideal listener, not other artists)</label>
                            <textarea id="target-audience" rows={3} value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="e.g., 'People who like to drive at night, fans of 80s movies, listeners of indie electronic music.'" />
                        </div>

                        <div className="mt-2 pt-4 border-t border-gray-700">
                            <button type="submit" disabled={!file || !artistName.trim() || !targetAudience.trim()} className="w-full flex items-center justify-center gap-3 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                                Get Content Ideas
                            </button>
                        </div>
                    </form>
                );
        }
    }
    
    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">Release Toolkit</h2>
            <p className="text-center text-gray-400 mt-2 mb-6">Get an AI critique, ideal listener profile, and marketing plan for your track.</p>
            {error && <ErrorMessage message={error} onRetry={handleGenerateInitial} />}
            {renderContent()}
        </div>
    );
};