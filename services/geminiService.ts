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


export const generateSongFromPrompt = async (prompt: string, singerGender: SingerGender, artistType: ArtistType, genre: string): Promise<SongData> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following idea, generate a complete song package. Idea: "${prompt}". The singer should be ${singerGender}, the artist type is ${artistType}, and the genre should be ${genre}.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: songDataSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SongData;
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