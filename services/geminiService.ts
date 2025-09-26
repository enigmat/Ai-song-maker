import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// Type definitions, matching the expected structure from the AI.
export type SingerGender = 'male' | 'female' | 'non-binary' | 'any';
export type ArtistType = 'solo' | 'band' | 'duo' | 'any';
export type VocalMelody = Record<string, any>; // Placeholder for a more complex type if needed

export interface SongData {
    title: string;
    artistName: string;
    artistBio: string;
    artistImagePrompt: string;
    lyrics: string;
    styleGuide: string;
    beatPattern: string;
    singerGender: SingerGender;
    artistType: ArtistType;
    vocalMelody: VocalMelody | null;
    bpm: number;
    videoPrompt: string;
    genre: string;
}

const songDataSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A creative and fitting title for the song." },
        artistName: { type: Type.STRING, description: "A plausible name for the artist or band." },
        artistBio: { type: Type.STRING, description: "A short, creative biography for the artist, fitting their style." },
        artistImagePrompt: { type: Type.STRING, description: "A detailed DALL-E prompt to generate a compelling image of the artist. Should describe the artist, setting, style, and composition. For example: 'Photo of a mysterious solo female singer in a dimly lit, smoky jazz club, vintage microphone, 1950s film noir style, high contrast black and white.'" },
        lyrics: { type: Type.STRING, description: "The complete song lyrics, formatted with sections like [Verse 1], [Chorus], [Bridge], etc." },
        styleGuide: { type: Type.STRING, description: "A detailed guide for music production, including genre, mood, instrumentation, vocal style, and tempo. Should be a few sentences long." },
        beatPattern: { type: Type.STRING, description: "A JSON string representing a 16-step drum pattern. Keys can be 'kick', 'snare', 'hihat', 'clap'. Values are arrays of integers from 0 to 15. Example: '{\"kick\": [0, 8], \"snare\": [4, 12], \"hihat\": [0,2,4,6,8,10,12,14]}'" },
        singerGender: { type: Type.STRING, description: "The gender of the singer ('male', 'female', 'non-binary', or 'any')." },
        artistType: { type: Type.STRING, description: "The type of artist ('solo', 'band', 'duo', or 'any')." },
        vocalMelody: { type: Type.NULL, description: "This should always be null for now." },
        bpm: { type: Type.INTEGER, description: "The tempo of the song in beats per minute (BPM), typically between 60 and 180." },
        videoPrompt: { type: Type.STRING, description: "A concise, evocative prompt for generating a music video. Focus on visual themes, colors, and actions. For example: 'A lone astronaut drifting through a vibrant, psychedelic nebula, slow-motion shots of cosmic dust, lens flare.'" },
        genre: { type: Type.STRING, description: "The musical genre of the song (e.g., 'Synthwave', 'Indie Rock', 'Lo-fi Hip Hop')." },
    },
    required: ["title", "artistName", "artistBio", "artistImagePrompt", "lyrics", "styleGuide", "beatPattern", "singerGender", "artistType", "vocalMelody", "bpm", "videoPrompt", "genre"]
};


export const generateSongFromPrompt = async (
    prompt: string,
    genre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    mood: string,
    tempo: string,
    melody: string,
    harmony: string,
    rhythm: string,
    instrumentation: string,
    atmosphere: string,
    vocalStyle: string
): Promise<SongData> => {
    
    const fullPrompt = `Based on the following idea and parameters, generate a complete song package.

    **Main Idea:** "${prompt}"

    **Stylistic Parameters:**
    - **Genre:** ${genre}
    - **Singer:** ${singerGender}
    - **Artist Type:** ${artistType}
    - **Mood:** ${mood}
    - **Tempo:** ${tempo}
    - **Vocal Style:** ${vocalStyle}
    - **Melodic Style:** ${melody}
    - **Harmonic Style:** ${harmony}
    - **Rhythmic Feel:** ${rhythm}
    - **Key Instrumentation:** ${instrumentation}
    - **Atmosphere/FX:** ${atmosphere}
    
    Adhere to all stylistic parameters when generating the song components. The 'Vocal Style' should heavily influence the generated lyrics and the 'styleGuide' description of the vocal performance.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: songDataSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SongData;
};

export const generateNewBeatPattern = async (styleGuide: string, genre: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following music style guide for a "${genre}" song, generate ONLY a JSON string for a new 16-step drum pattern.
        Style Guide: "${styleGuide}"
        The JSON should only contain keys for 'kick', 'snare', 'hihat', and 'clap', with values being arrays of integers from 0 to 15.
        Example format: '{"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14]}'
        Do not include any other text, explanations, or markdown formatting.`,
        config: {
            // No schema needed, as we're expecting a raw string that is JSON.
        },
    });
    // Clean up potential markdown formatting from the response
    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();
    return cleanedText;
};


export const generateStorylines = async (topic: string): Promise<string[]> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 creative, one-sentence song storylines based on the topic: "${topic}".`,
    });
    // Split by newlines and filter out any empty lines or list markers.
    return response.text.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateVideo = async (prompt: string): Promise<string> => {
    let operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: prompt,
      config: {
        numberOfVideos: 1
      }
    });

    while (!operation.done) {
      // Poll every 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

// New types and schema for MP3 analysis
export interface Ratings {
    commercialPotential: { score: number; justification: string };
    originality: { score: number; justification: string };
    composition: { score: number; justification: string };
    productionQuality: { score: number; justification: string };
}
export interface Marketability {
    targetAudience: string;
    playlistFit: string[];
    syncPotential: string;
}

export interface AnalysisReport {
    ratings: Ratings;
    pros: string[];
    cons: string[];
    summary: string;
    marketability: Marketability;
}

const ratingProperty = {
    type: Type.OBJECT,
    properties: {
        score: { type: Type.INTEGER, description: "A rating score from 1 to 100." },
        justification: { type: Type.STRING, description: "A brief, one-sentence justification for the score." }
    },
    required: ["score", "justification"]
};


const analysisReportSchema = {
    type: Type.OBJECT,
    properties: {
        ratings: {
            type: Type.OBJECT,
            properties: {
                commercialPotential: { ...ratingProperty, description: "The song's potential for commercial success." },
                originality: { ...ratingProperty, description: "How unique and creative the song is." },
                composition: { ...ratingProperty, description: "The quality of the song's structure, melody, and harmony." },
                productionQuality: { ...ratingProperty, description: "A hypothetical assessment of the mix, mastering, and overall sound quality." }
            },
            required: ["commercialPotential", "originality", "composition", "productionQuality"]
        },
        pros: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "A list of 3-5 potential positive aspects or strengths of the song, written as complete sentences." 
        },
        cons: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "A list of 3-5 potential negative aspects or areas for improvement for the song, written as complete sentences." 
        },
        summary: { 
            type: Type.STRING, 
            description: "A concluding summary of the analysis, 2-3 sentences long." 
        },
        marketability: {
            type: Type.OBJECT,
            properties: {
                targetAudience: {
                    type: Type.STRING,
                    description: "A description of the likely target audience for this song (e.g., age, interests)."
                },
                playlistFit: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of 3-5 specific, well-known playlist categories or names (e.g., 'Spotify's Lo-fi Beats', 'Chill Hits') where this song would fit well."
                },
                syncPotential: {
                    type: Type.STRING,
                    description: "A brief analysis of the song's potential for sync licensing in media like films, TV shows, or advertisements."
                }
            },
            required: ["targetAudience", "playlistFit", "syncPotential"]
        }
    },
    required: ["ratings", "pros", "cons", "summary", "marketability"]
};

export const analyzeSong = async (fileName: string, genre: string, description: string): Promise<AnalysisReport> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Act as an expert A&R scout and music critic. Based on the following information about a song, provide a detailed analysis.
        The analysis should be hypothetical, as you cannot listen to the audio.
        File Name: "${fileName}"
        Genre: "${genre}"
        Description: "${description}"

        Your analysis must include:
        1. Overall Scorecard: Provide ratings from 1-100 for Commercial Potential, Originality, Composition, and hypothetical Production Quality. Each rating needs a brief justification.
        2. Pros & Cons: A balanced critique. The pros should highlight potential strengths (composition, arrangement, emotional impact). The cons should point out potential weaknesses or areas for improvement. Be constructive.
        3. Marketability: A detailed market analysis including:
            - Target Audience: Describe the ideal listener demographic.
            - Playlist Fit: Suggest specific, popular playlist categories or names where the song would fit.
            - Sync Potential: Describe opportunities for licensing in film, TV, or advertising.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisReportSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AnalysisReport;
};