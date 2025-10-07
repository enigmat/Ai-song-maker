import React, { useState, useEffect } from 'react';
import { getCreditBalance, addCredits, getPurchaseHistory } from '../services/creditService';
import { LoadingSpinner } from './LoadingSpinner';

const creditPackages = [
    { amount: 5, label: '$5.00', description: 'Perfect for getting started and exploring.' },
    { amount: 10, label: '$10.00', description: 'Great for a few full projects.' },
    { amount: 25, label: '$25.00', description: 'Best value for frequent creators.' },
];

export const Billing: React.FC = () => {
    const [balance, setBalance] = useState(0);
    const [history, setHistory] = useState<{timestamp: number; amount: number}[]>([]);
    const [isPurchasing, setIsPurchasing] = useState<number | null>(null);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    useEffect(() => {
        setBalance(getCreditBalance());
        setHistory(getPurchaseHistory());
    }, []);

    const handlePurchase = (amount: number) => {
        setIsPurchasing(amount);
        setPurchaseSuccess(false);

        // Simulate a network request
        setTimeout(() => {
            const newBalance = addCredits(amount);
            setBalance(newBalance);
            setHistory(getPurchaseHistory());
            setIsPurchasing(null);
            setPurchaseSuccess(true);
            setTimeout(() => setPurchaseSuccess(false), 3000);
        }, 1500);
    };

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    return (
        <div className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 space-y-8">
            <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">
                Billing & Plan
            </h2>

            {purchaseSuccess && (
                <div className="p-4 bg-green-900/50 border border-green-500 text-green-300 rounded-lg text-center animate-fade-in">
                    Purchase successful! Your new balance is {currencyFormatter.format(balance)}.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-lg">Current Balance</p>
                    <p className={`text-5xl font-bold mt-2 ${balance < 0 ? 'text-red-500' : 'text-green-400'}`}>
                        {currencyFormatter.format(balance)}
                    </p>
                    {balance < 0.10 && (
                         <p className="mt-2 text-sm text-yellow-400">Your balance is running low. Please top up to continue creating.</p>
                    )}
                </div>
                <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-lg">Current Plan</p>
                    <p className="text-5xl font-bold mt-2 text-purple-400">Creator Tier</p>
                    <p className="mt-2 text-sm text-gray-500">Pay-as-you-go API usage.</p>
                </div>
            </div>

            <div>
                <h3 className="text-2xl font-semibold text-gray-200 text-center mb-6">Top Up Credits</h3>
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
                                            {currencyFormatter.format(item.amount)}
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
             <p className="text-center text-gray-500 text-xs">
                This is a simulated billing page. No real payment will be processed.
            </p>
        </div>
    );
};