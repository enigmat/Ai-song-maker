import React from 'react';
import { SongStructureAnalysis } from '../types';

interface SongStructureViewerProps {
    analysis: SongStructureAnalysis;
}

export const SongStructureViewer: React.FC<SongStructureViewerProps> = ({ analysis }) => {
    return (
        <div className="animate-fade-in space-y-6 text-left">
            <div>
                <h3 className="text-lg font-bold text-gray-200 border-b-2 border-purple-500/50 pb-2 mb-3">
                    Overall Feedback
                </h3>
                <p className="text-gray-300 leading-relaxed">{analysis.overallFeedback}</p>
            </div>
            
            <div>
                <h3 className="text-lg font-bold text-gray-200 border-b-2 border-purple-500/50 pb-2 mb-3">
                    Song Structure
                </h3>
                <div className="space-y-6">
                    {analysis.sections.map((section, index) => (
                        <div key={index}>
                            <h4 className="font-bold text-purple-400 text-md mb-2">
                                [{section.type}]
                            </h4>
                            <pre className="whitespace-pre-wrap font-sans text-gray-300 text-left leading-relaxed text-sm sm:text-base">
                                {section.lyrics}
                            </pre>
                            {section.suggestion && (
                                <div className="mt-3 p-3 bg-teal-900/40 border-l-4 border-teal-500 rounded-r-lg">
                                    <p className="font-semibold text-teal-300 text-sm">Suggestion:</p>
                                    <p className="text-teal-200/90 text-sm italic">{section.suggestion}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};