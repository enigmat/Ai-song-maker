import React, { useState, useEffect } from 'react';
import { getUsage, resetUsage, UsageData, ApiCallLog } from '../services/usageService';

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-gray-800/50 p-4 rounded-xl flex items-center gap-4 border border-gray-700">
        <div className="p-3 rounded-full bg-gray-700/50 text-purple-400">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const CostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 10v-2m0-4h.01M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CallsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const VideoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;


export const UsageDashboard: React.FC = () => {
    const [usage, setUsage] = useState<UsageData | null>(null);

    useEffect(() => {
        setUsage(getUsage());
    }, []);

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all tracked usage data? This action cannot be undone.')) {
            resetUsage();
            setUsage(getUsage());
        }
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
    });

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 space-y-6">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                API Usage Dashboard
            </h2>
            <div className="p-3 bg-yellow-900/30 text-yellow-300/80 border border-yellow-500/30 rounded-lg text-sm text-center">
                <strong>Disclaimer:</strong> This dashboard provides an <span className="font-bold">estimate</span> of your API usage costs based on public pricing. Your actual bill may vary. For official billing information, please consult your Google Cloud Console.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard 
                    label="Total Estimated Cost" 
                    value={currencyFormatter.format(usage?.totalCost || 0)} 
                    icon={<CostIcon />} 
                />
                <StatCard 
                    label="Total API Calls" 
                    value={usage?.apiCalls.length || 0}
                    icon={<CallsIcon />}
                />
                 <StatCard 
                    label="Total Characters" 
                    value={(usage?.totalInputChars || 0) + (usage?.totalOutputChars || 0)} 
                    icon={<TextIcon />}
                />
                <StatCard 
                    label="Total Images" 
                    value={usage?.totalImages || 0}
                    icon={<ImageIcon />}
                />
                <StatCard 
                    label="Total Video (sec)" 
                    value={usage?.totalVideoSeconds || 0}
                    icon={<VideoIcon />}
                />
            </div>

            <div>
                <h3 className="text-xl font-bold text-gray-200 mb-4">Recent API Calls</h3>
                <div className="bg-gray-900/50 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Timestamp</th>
                                <th scope="col" className="px-4 py-3">Model</th>
                                <th scope="col" className="px-4 py-3">Description</th>
                                <th scope="col" className="px-4 py-3 text-right">Est. Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usage?.apiCalls && usage.apiCalls.length > 0 ? (
                                [...usage.apiCalls].reverse().map((call: ApiCallLog, index: number) => (
                                    <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/30">
                                        <td className="px-4 py-3 font-mono text-xs">{new Date(call.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">{call.model}</td>
                                        <td className="px-4 py-3">{call.description}</td>
                                        <td className="px-4 py-3 text-right font-mono text-xs text-teal-400">{currencyFormatter.format(call.cost)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">No API calls have been tracked yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="pt-4 text-center">
                <button
                    onClick={handleReset}
                    className="px-6 py-2 text-sm font-semibold text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors"
                >
                    Reset Usage Data
                </button>
            </div>
        </div>
    );
};