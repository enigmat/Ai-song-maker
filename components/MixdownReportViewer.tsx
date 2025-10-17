import React from 'react';
import type { MixdownReport, MixdownReportSection } from '../types';

const ReportSection: React.FC<{ title: string; data: MixdownReportSection; icon: React.ReactNode; }> = ({ title, data, icon }) => (
    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
        <h3 className="flex items-center gap-3 text-xl font-bold text-gray-200 mb-4">
            <span className="text-purple-400">{icon}</span>
            {title}
        </h3>
        <div>
            <h4 className="font-semibold text-gray-300">Feedback:</h4>
            <p className="mt-1 text-gray-400 text-sm leading-relaxed">{data.feedback}</p>
        </div>
        <div className="mt-4">
            <h4 className="font-semibold text-teal-300">Suggestion:</h4>
            <p className="mt-1 text-gray-300 text-sm leading-relaxed">{data.suggestion}</p>
        </div>
    </div>
);

const FrequencyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.536 4.846A9.986 9.986 0 0112 5c.17 0 .337-.015.504-.045m-1.008 0a9.986 9.986 0 00-5.002 0m10.004 0A9.986 9.986 0 0117 5c.17 0 .337.015.504.045m-1.008 0a9.986 9.986 0 00-5.002 0m-10.004 0A9.986 9.986 0 012 5c.17 0 .337.015.504.045m-1.008 0a9.986 9.986 0 00-5.002 0m10.004 0A9.986 9.986 0 0112 5c.17 0 .337-.015.504-.045M2 5h20M2 5a2 2 0 012-2h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm4 10h.01M10 15h.01M16 15h.01" /></svg>);
const DynamicsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l4 8 5-10 5 10 4-8" /></svg>);
const StereoIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-12.728 0a9 9 0 010-12.728m12.728 0L5.636 18.364" /></svg>);

interface MixdownReportViewerProps {
    report: MixdownReport;
    fileName: string;
}

export const MixdownReportViewer: React.FC<MixdownReportViewerProps> = ({ report, fileName }) => {
    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-center text-gray-200">Mixdown Report</h2>
             <p className="text-center text-gray-400 -mt-4 break-words">For: <span className="font-semibold text-gray-300">{fileName}</span></p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ReportSection title="Frequency Balance" data={report.frequencyBalance} icon={<FrequencyIcon />} />
                <ReportSection title="Dynamics" data={report.dynamics} icon={<DynamicsIcon />} />
                <ReportSection title="Stereo Image" data={report.stereoImage} icon={<StereoIcon />} />
            </div>

            <div className="bg-gray-900/50 p-6 rounded-lg border border-teal-500/30">
                <h3 className="text-xl font-bold text-teal-300 mb-2 text-center">Overall Summary</h3>
                <p className="text-center text-gray-300 max-w-2xl mx-auto">{report.overallSummary}</p>
            </div>
        </div>
    );
};