import React, { useState, useEffect, useRef } from 'react';
import { getUsage, resetUsage, UsageData, ApiCallLog } from '../services/usageService';
import { getCreditBalance, addCredits, getPurchaseHistory } from '../services/creditService';
import { LoadingSpinner } from './LoadingSpinner';

const creditPackages = [
    { amount: 5, label: '$5.00', description: 'Perfect for getting started and exploring.' },
    { amount: 10, label: '$10.00', description: 'Great for a few full projects.' },
    { amount: 25, label: '$25.00', description: 'Best value for frequent creators.' },
];

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
const AudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>;
const CreditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;


export const UsageDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<{timestamp: number; amount: number}[]>([]);
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);
    
    const purchaseSectionRef = useRef<HTMLDivElement>(null);

    const refreshData = () => {
        setUsage(getUsage());
        setBalance(getCreditBalance());
        setHistory(getPurchaseHistory());
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
        }
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Incorrect password. Please try again.');
        }
    };
    
    const handlePurchase = (amount: number) => {
        setIsPurchasing(amount);
        setPurchaseSuccess(false);

        // Simulate a network request
        setTimeout(() => {
            addCredits(amount);
            refreshData(); // Refresh all data after purchase
            setIsPurchasing(null);
            setPurchaseSuccess(true);
            setTimeout(() => setPurchaseSuccess(false), 3000);
        }, 1500);
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all tracked usage data? This action cannot be undone.')) {
            resetUsage();
            refreshData();
        }
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6 });
    const creditFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    if (!isAuthenticated) {
        return (
            <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
                <div className="max-w-md mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-200">Admin Access Required</h2>
                    <p className="mt-2 text-gray-400">Please enter the password to view the dashboard.</p>
                    <form onSubmit={handleLogin} className="mt-6 space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                        />
                        {authError && <p className="text-red-400 text-sm">{authError}</p>}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                            Login
                        </button>
                    </form>
                    <p className="mt-4 text-xs text-gray-500">Hint: The password is `admin123`</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 space-y-8">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Admin Dashboard & Billing
            </h2>
            <div className="p-3 bg-yellow-900/30 text-yellow-300/80 border border-yellow-500/30 rounded-lg text-sm text-center">
                <strong>Disclaimer:</strong> This dashboard provides an <span className="font-bold">estimate</span> of your API usage costs based on public pricing. Your actual bill may vary.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 <StatCard 
                    label="Remaining Credits" 
                    value={creditFormatter.format(balance)}
                    icon={<CreditIcon />} 
                />
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
                    label="Total Audio (sec)" 
                    value={usage?.totalAudioSeconds || 0}
                    icon={<AudioIcon />}
                />
            </div>

            {balance < 0.10 && (
                 <div className="p-4 bg-yellow-900/30 text-yellow-300/80 border border-yellow-500/30 rounded-lg text-center flex items-center justify-between animate-fade-in">
                    <span>Your credit balance is low.</span>
                    <button onClick={() => purchaseSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="px-4 py-2 text-sm font-semibold bg-yellow-600/50 text-white rounded-md hover:bg-yellow-500/50 transition-colors">
                        Add Credits
                    </button>
                </div>
            )}

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

            <div ref={purchaseSectionRef} className="pt-4">
                <h3 className="text-2xl font-semibold text-gray-200 text-center mb-6">Top Up Credits</h3>
                {purchaseSuccess && (
                    <div className="p-4 mb-4 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-center animate-fade-in">
                        Purchase successful! Your new balance is {creditFormatter.format(balance)}.
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {creditPackages.map(pkg => (
                        <div key={pkg.amount} className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center flex flex-col justify-between hover:border-purple-500 transition-all">
                            <div>
                                <p className="text-4xl font-bold text-teal-400">{pkg.label}</p>
                                <p className="mt-2 text-gray-400 text-sm h-12">{pkg.description}</p>
                            </div>
                            <button
                                onClick={() => handlePurchase(pkg.amount)}
                                disabled={isPurchasing !== null}
                                className="mt-6 w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-wait"
                            >
                                {isPurchasing === pkg.amount ? <LoadingSpinner /> : 'Purchase'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                 <h3 className="text-2xl font-semibold text-gray-200 text-center mb-6">Purchase History</h3>
                 <div className="bg-gray-900/50 rounded-lg border border-gray-700 max-h-60 overflow-y-auto">
                    {history.length > 0 ? (
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800/50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Date</th>
                                    <th scope="col" className="px-4 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.timestamp} className="border-b border-gray-700">
                                        <td className="px-4 py-3">{new Date(item.timestamp).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-400">
                                            {creditFormatter.format(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 p-8">No purchase history yet.</p>
                    )}
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
