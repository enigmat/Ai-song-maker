import { spendCredits } from './creditService';

// --- PRICING (as of late 2024, for estimation purposes) ---
// Prices are per 1 million characters/images/seconds. We divide by 1,000,000 to get the per-unit price.
const PER_MILLION = 1_000_000;

const PRICING = {
    'gemini-2.5-flash': {
        inputChar: 0.35 / PER_MILLION,
        outputChar: 0.70 / PER_MILLION,
    },
    'imagen-4.0-generate-001': {
        perImage: 8.00 / PER_MILLION,
    },
    'gemini-2.5-flash-image': {
        perImage: 0.70 / PER_MILLION,
    },
    'gemini-2.5-flash-native-audio-preview-09-2025': {
        perSecond: 0.28 / PER_MILLION,
    },
};

const USAGE_STORAGE_KEY = 'mustbmusic_api_usage';
const MAX_LOG_ENTRIES = 100;

export interface ApiCallLog {
    timestamp: number;
    model: string;
    type: 'text' | 'image' | 'audio' | 'multimodal';
    cost: number;
    description: string;
}

export interface UsageData {
    totalCost: number;
    totalInputChars: number;
    totalOutputChars: number;
    totalImages: number;
    totalAudioSeconds: number;
    apiCalls: ApiCallLog[];
}

interface TrackUsageParams {
    model: keyof typeof PRICING;
    type: 'text' | 'image' | 'audio' | 'multimodal';
    inputChars?: number;
    outputChars?: number;
    count?: number; // For images
    seconds?: number; // For video/audio
    description: string;
}

export const getUsage = (): UsageData => {
    try {
        const rawData = localStorage.getItem(USAGE_STORAGE_KEY);
        if (rawData) {
            return JSON.parse(rawData);
        }
    } catch (e) {
        console.error("Failed to parse usage data from localStorage", e);
    }
    // Return default empty state
    return {
        totalCost: 0,
        totalInputChars: 0,
        totalOutputChars: 0,
        totalImages: 0,
        totalAudioSeconds: 0,
        apiCalls: [],
    };
};

export const resetUsage = (): void => {
    localStorage.removeItem(USAGE_STORAGE_KEY);
};

export const trackUsage = (params: TrackUsageParams): void => {
    const usage = getUsage();
    let cost = 0;

    const modelPricing = PRICING[params.model];
    if (!modelPricing) {
        console.warn(`No pricing information found for model: ${params.model}`);
        return;
    }

    if (params.type === 'text' || params.type === 'multimodal') {
        const inputChars = params.inputChars || 0;
        const outputChars = params.outputChars || 0;
        if ('inputChar' in modelPricing && 'outputChar' in modelPricing) {
            cost += (inputChars * modelPricing.inputChar) + (outputChars * modelPricing.outputChar);
        }
        usage.totalInputChars += inputChars;
        usage.totalOutputChars += outputChars;
    }
    
    if (params.type === 'image' || params.type === 'multimodal') { // multimodal can include images
        const count = params.count || 0;
        if ('perImage' in modelPricing) {
            cost += count * modelPricing.perImage;
        }
        usage.totalImages += count;
    }
    
    if (params.type === 'audio') {
        const seconds = params.seconds || 0;
        if ('perSecond' in modelPricing) {
            cost += seconds * modelPricing.perSecond;
        }
        usage.totalAudioSeconds += seconds;
    }


    usage.totalCost += cost;

    const newLogEntry: ApiCallLog = {
        timestamp: Date.now(),
        model: params.model,
        type: params.type,
        cost: cost,
        description: params.description,
    };
    
    usage.apiCalls.push(newLogEntry);

    // Keep the log from growing indefinitely
    if (usage.apiCalls.length > MAX_LOG_ENTRIES) {
        usage.apiCalls.splice(0, usage.apiCalls.length - MAX_LOG_ENTRIES);
    }
    
    try {
        localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
        spendCredits(cost);
    } catch (e) {
        console.error("Failed to save usage data to localStorage", e);
    }
};
