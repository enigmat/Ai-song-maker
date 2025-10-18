import React from 'react';
import type { ArtistStyleProfile } from '../types';

interface Recipe {
    name: string;
    description: string;
    profile: ArtistStyleProfile;
}

const recipes: Recipe[] = [
    {
        name: 'Synthwave Banger',
        description: "A driving, nostalgic track perfect for a night drive through a neon-lit city. Retro synths and a punchy beat.",
        profile: {
            genre: 'Synthwave', singerGender: 'any', artistType: 'solo', mood: 'Driving',
            tempo: 'Medium (80-120 BPM)', melody: 'Simple and Catchy', harmony: 'Diatonic and Simple',
            rhythm: 'Steady and Driving', instrumentation: 'Synth-heavy', atmosphere: 'Spacious and Reverb-heavy',
            vocalStyle: 'Clear & Melodic'
        }
    },
    {
        name: 'Acoustic Folk Ballad',
        description: 'An intimate, heartfelt song with a focus on storytelling. Perfect for a quiet, reflective moment.',
        profile: {
            genre: 'Acoustic', singerGender: 'any', artistType: 'solo', mood: 'Introspective',
            tempo: 'Slow (60-80 BPM)', melody: 'Lyrical and Flowing', harmony: 'Diatonic and Simple',
            rhythm: 'Loose and Rubato', instrumentation: 'Acoustic', atmosphere: 'Dry and Intimate',
            vocalStyle: 'Soft & Gentle'
        }
    },
    {
        name: 'Lo-fi Chill Hop',
        description: 'A relaxing, hazy beat perfect for studying, working, or just chilling out. Features dusty drums and jazzy chords.',
        profile: {
            genre: 'Lo-fi', singerGender: 'any', artistType: 'solo', mood: 'Relaxing',
            tempo: 'Medium (80-120 BPM)', melody: 'Improvisational', harmony: 'Chromatic and Complex',
            rhythm: 'Syncopated and Funky', instrumentation: 'Minimalist', atmosphere: 'Lo-fi and Hazy',
            vocalStyle: 'Rhythmic & Spoken'
        }
    },
     {
        name: 'Trap Anthem',
        description: 'An energetic, hard-hitting track with heavy 808s and rapid-fire hi-hats. Made for the club.',
        profile: {
            genre: 'Trap', singerGender: 'any', artistType: 'solo', mood: 'Aggressive',
            tempo: 'Fast (120-160 BPM)', melody: 'Simple and Catchy', harmony: 'Diatonic and Simple',
            rhythm: 'Syncopated and Funky', instrumentation: 'Synth-heavy', atmosphere: 'Dark and Moody',
            vocalStyle: 'Rhythmic & Spoken'
        }
    }
];

interface RecipeBrowserProps {
    onSelectRecipe: (profile: ArtistStyleProfile) => void;
    onClose: () => void;
}

export const RecipeBrowser: React.FC<RecipeBrowserProps> = ({ onSelectRecipe, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
             <style>{`.animate-fade-in-fast { animation: fade-in-fast 0.1s ease-out forwards; } @keyframes fade-in-fast { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
                        📖 Recipe Browser
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="flex-grow p-6 overflow-y-auto">
                    <p className="text-center text-gray-400 mb-6">Choose a recipe as a starting point for your song. All style parameters will be set for you.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recipes.map(recipe => (
                            <div key={recipe.name} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-purple-400">{recipe.name}</h3>
                                    <p className="mt-2 text-sm text-gray-300">{recipe.description}</p>
                                </div>
                                <button
                                    onClick={() => onSelectRecipe(recipe.profile)}
                                    className="mt-4 w-full text-sm font-semibold px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-500 transition-colors"
                                >
                                    Use Recipe
                                </button>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
