import React from 'react';
import type { AnalysisReport } from '../services/geminiService';

interface ReportViewerProps {
    report: AnalysisReport;
    fileName: string;
    onClose: () => void;
}

const ScoreCircle: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    const circumference = 2 * Math.PI * 45; // r = 45
    const offset = circumference - (score / 100) * circumference;

    const getStrokeColor = (s: number) => {
        if (s >= 85) return 'stroke-green-400';
        if (s >= 60) return 'stroke-yellow-400';
        return 'stroke-red-400';
    };

    return (
        <div className="flex flex-col items-center text-center">
            <div className="relative w-28 h-28">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        className="text-gray-700"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    {/* Progress circle */}
                    <circle
                        className={`transition-all duration-1000 ease-out ${getStrokeColor(score)}`}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        transform="rotate(-90 50 50)"
                    />
                    {/* Text */}
                    <text x="50" y="50" fontFamily="sans-serif" fontSize="24" fontWeight="bold" textAnchor="middle" dy=".3em" className={`fill-current ${getStrokeColor(score).replace('stroke-', 'text-')}`}>
                        {score}
                    </text>
                </svg>
            </div>
            <p className="mt-2 font-semibold text-gray-300 text-sm">{label}</p>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="report-section">
        <h2 className="text-xl font-bold text-gray-200 border-b-2 border-purple-500/50 pb-2 mb-4">
            {title}
        </h2>
        <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
            {children}
        </div>
    </div>
);

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, fileName, onClose }) => {
    
    const handlePrint = () => {
        window.print();
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in-fast print:bg-white print:p-0">
             <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast { animation: fade-in-fast 0.1s ease-out forwards; }
                
                @media print {
                    body {
                        background-color: #fff;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        padding: 1rem;
                        box-shadow: none;
                        border: none;
                        color: #000;
                        background-color: #fff;
                    }
                    .printable-area h1, .printable-area h2, .printable-area p, .printable-area li {
                        color: #000 !important;
                    }
                    .printable-area .prose-invert {
                        --tw-prose-body: #000;
                        --tw-prose-headings: #000;
                        --tw-prose-bold: #000;
                        --tw-prose-bullets: #000;
                    }
                    .report-section {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] printable-area">
                <header className="p-4 border-b border-gray-600 flex justify-between items-center flex-shrink-0 no-print">
                    <h2 className="text-xl font-bold text-gray-200">A&R Analysis Report</h2>
                    <div className="flex items-center gap-2">
                         <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 bg-teal-600 text-white shadow-lg hover:bg-teal-500">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>
                            Print Report
                        </button>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>

                <main className="flex-grow p-6 overflow-y-auto space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 text-transparent bg-clip-text">A&R Analysis Report</h1>
                        <p className="mt-1 text-gray-400">For Song: <span className="font-semibold text-gray-300">{fileName}</span></p>
                    </div>

                    <Section title="Overall Scorecard">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                            <ScoreCircle label="Commercial Potential" score={report.ratings.commercialPotential.score} />
                            <ScoreCircle label="Originality" score={report.ratings.originality.score} />
                            <ScoreCircle label="Composition" score={report.ratings.composition.score} />
                            <ScoreCircle label="Production Quality" score={report.ratings.productionQuality.score} />
                        </div>
                    </Section>

                    <Section title="Critique">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-green-400 mb-2">Pros</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    {report.pros.map((pro, i) => <li key={`pro-${i}`}>{pro}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-400 mb-2">Cons</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    {report.cons.map((con, i) => <li key={`con-${i}`}>{con}</li>)}
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="Marketability">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold">Target Audience</h3>
                                <p>{report.marketability.targetAudience}</p>
                            </div>
                             <div>
                                <h3 className="text-lg font-semibold">Playlist Fit</h3>
                                <ul className="list-disc list-inside">
                                    {report.marketability.playlistFit.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Sync Potential</h3>
                                <p>{report.marketability.syncPotential}</p>
                            </div>
                        </div>
                    </Section>

                     <Section title="Executive Summary">
                        <p>{report.summary}</p>
                    </Section>
                </main>
            </div>
        </div>
    );
};