export const CREDIT_STORAGE_KEY = 'mustbmusic_credits';
export const HISTORY_STORAGE_KEY = 'mustbmusic_purchase_history';

const DEFAULT_CREDITS = 1.00; // Start with $1.00

interface Purchase {
    timestamp: number;
    amount: number;
}

export const getCreditBalance = (): number => {
    try {
        const rawData = localStorage.getItem(CREDIT_STORAGE_KEY);
        if (rawData) {
            const balance = parseFloat(rawData);
            return isNaN(balance) ? DEFAULT_CREDITS : balance;
        } else {
            // Set initial credits if none exist
            localStorage.setItem(CREDIT_STORAGE_KEY, DEFAULT_CREDITS.toString());
            return DEFAULT_CREDITS;
        }
    } catch (e) {
        console.error("Failed to access credit balance from localStorage", e);
        return DEFAULT_CREDITS;
    }
};

export const addCredits = (amount: number): number => {
    const currentBalance = getCreditBalance();
    const newBalance = currentBalance + amount;
    try {
        localStorage.setItem(CREDIT_STORAGE_KEY, newBalance.toString());
        addPurchaseToHistory(amount);
    } catch (e) {
        console.error("Failed to save credit balance to localStorage", e);
    }
    return newBalance;
};

export const spendCredits = (cost: number): number => {
    const currentBalance = getCreditBalance();
    const newBalance = currentBalance - cost;
    try {
        localStorage.setItem(CREDIT_STORAGE_KEY, newBalance.toString());
    } catch (e) {
        console.error("Failed to update credit balance in localStorage", e);
    }
    return newBalance;
};

export const getPurchaseHistory = (): Purchase[] => {
     try {
        const rawData = localStorage.getItem(HISTORY_STORAGE_KEY);
        return rawData ? JSON.parse(rawData) : [];
    } catch (e) {
        console.error("Failed to parse purchase history from localStorage", e);
        return [];
    }
}

const addPurchaseToHistory = (amount: number): void => {
    const history = getPurchaseHistory();
    const newPurchase: Purchase = {
        timestamp: Date.now(),
        amount,
    };
    const updatedHistory = [newPurchase, ...history].slice(0, 20); // Keep last 20 purchases
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
        console.error("Failed to save purchase history to localStorage", e);
    }
}
