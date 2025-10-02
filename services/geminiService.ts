import { GoogleGenAI, Type, Modality, LiveServerMessage, Blob } from "@google/genai";

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// Type definitions, matching the expected structure from the AI.
export type SingerGender = 'male' | 'female' | 'non-binary' | 'any';
export type ArtistType = 'solo' | 'band' | 'duo' | 'any';
export type VocalMelody = Record<string, any>; // Placeholder for a more complex type if needed

export interface SongData {
    title: string;
    artistName: string;
    artistBio: string;
    albumCoverPrompt: string;
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

// New type for hummed melody notes
export interface MelodyNote {
    pitch: string; // e.g., "C4"
    startTime: number; // in seconds
    duration: number; // in seconds
}

export interface MelodyAnalysis {
    bpm: number;
    notes: MelodyNote[];
}

const songDataSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A creative and fitting title for the song." },
        artistName: { type: Type.STRING, description: "A plausible name for the artist or band." },
        artistBio: { type: Type.STRING, description: "A short, creative biography for the artist, fitting their style." },
        albumCoverPrompt: { type: Type.STRING, description: "A detailed, artistic prompt for an image generation model to create a compelling album cover. The prompt should reflect the song's title, genre, mood, and artist's persona. It should describe the subject, setting, style, composition, and color palette. For example: 'Surrealist oil painting of a lone astronaut playing a glowing guitar on a desolate moon, with Earth hanging in the star-filled sky. Melancholic, dreamy, shades of deep blue and purple.'" },
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
    required: ["title", "artistName", "artistBio", "albumCoverPrompt", "lyrics", "styleGuide", "beatPattern", "singerGender", "artistType", "vocalMelody", "bpm", "videoPrompt", "genre"]
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

export const generateRemixedSong = async (
    originalTitle: string,
    originalArtist: string,
    targetGenre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    mood: string,
): Promise<SongData> => {
    
    const fullPrompt = `Act as an expert music producer and songwriter specializing in recreating songs for different eras. Your task is to reimagine a song based on the provided inspiration and parameters. The new song should capture the core theme and emotional essence of the original but be completely new in its composition, lyrics, and production style, fitting perfectly into the target genre. Do not copy lyrics or melodies from the original.

    **Inspiration Song:** "${originalTitle}" by ${originalArtist}

    **Target Style:**
    - **Genre:** ${targetGenre}
    - **Singer:** ${singerGender}
    - **Artist Type:** ${artistType}
    - **Mood:** ${mood}

    Generate a complete song package based on this, creating a new, plausible artist that would fit this remixed style. The genre you return in the final JSON output must be the same as the target genre provided above.`;

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

export const generateRemixedSongFromLyrics = async (
    originalLyrics: string,
    originalFileName: string,
    targetGenre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    mood: string,
): Promise<SongData> => {
    
    const fullPrompt = `Act as an expert music producer and songwriter specializing in recreating songs for different eras. Your task is to reimagine a song based on the provided lyrics and parameters. The new song should capture the core theme and emotional essence of the original lyrics but be completely new in its composition, lyrics, and production style, fitting perfectly into the target genre. Do not copy the original lyrics verbatim; instead, write new lyrics inspired by their themes and story.

    **Inspiration Lyrics (from file "${originalFileName}"):**
    ---
    ${originalLyrics}
    ---

    **Target Style:**
    - **Genre:** ${targetGenre}
    - **Singer:** ${singerGender}
    - **Artist Type:** ${artistType}
    - **Mood:** ${mood}

    Generate a complete song package based on this, creating a new, plausible artist that would fit this remixed style. The genre you return in the final JSON output must be the same as the target genre provided above.`;

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

const melodyNoteSchema = {
    type: Type.OBJECT,
    properties: {
        pitch: { type: Type.STRING, description: "The musical pitch of the note in scientific notation (e.g., 'A4', 'C#5')." },
        startTime: { type: Type.NUMBER, description: "The start time of the note in seconds from the beginning of the audio." },
        duration: { type: Type.NUMBER, description: "The duration of the note in seconds." }
    },
    required: ["pitch", "startTime", "duration"]
};

const melodyAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        bpm: { type: Type.INTEGER, description: "The estimated tempo of the hummed melody in beats per minute." },
        notes: {
            type: Type.ARRAY,
            items: melodyNoteSchema
        }
    },
    required: ["bpm", "notes"]
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result as string;
            // The result includes the data URL prefix, which needs to be removed.
            resolve(base64data.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateMelodyFromHum = async (audioBlob: Blob): Promise<MelodyAnalysis> => {
    const base64Audio = await blobToBase64(audioBlob);

    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio,
        },
    };

    const textPart = {
        text: `You are an expert audio analyst specializing in music theory. Your task is to perform pitch detection on the provided audio file, which contains a person humming a single melodic line. Transcribe this melody into a structured JSON format.
- Analyze the fundamental frequencies to identify the musical pitch of each note.
- Represent pitches using scientific pitch notation (e.g., 'C4', 'F#5').
- Determine the precise start time and duration for each note in seconds.
- Estimate the overall tempo (BPM) of the performance.
- Ignore non-pitched sounds like breaths, clicks, or background noise.
- The output must be ONLY the JSON object, without any markdown formatting or explanatory text.
`
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: melodyAnalysisSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as MelodyAnalysis;
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

/**
 * Edits an image based on a text prompt using the gemini-2.5-flash-image-preview model.
 * @param base64ImageData The base64-encoded string of the original image.
 * @param mimeType The MIME type of the original image (e.g., 'image/jpeg').
 * @param prompt The text prompt describing the desired edit.
 * @returns A new data URL (e.g., 'data:image/png;base64,...') for the edited image.
 */
export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    // Find the image part in the response
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const newBase64 = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType;
            return `data:${newMimeType};base64,${newBase64}`;
        }
    }

    // If no image is returned, throw an error. The model might just respond with text.
    throw new Error("The AI did not return an edited image. It may have responded: " + response.text);
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
                    description: "A list of 3-5 specific Spotify playlist names or categories (e.g., 'Spotify's Lo-fi Beats', 'Chill Hits', 'Today's Top Hits') where this song would be a good fit. Be specific with playlist names."
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
            - Playlist Fit: Suggest specific, popular Spotify playlist names where the song would fit. Think about both editorial and algorithmic playlists.
            - Sync Potential: Describe opportunities for licensing in film, TV, or advertising.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisReportSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AnalysisReport;
};

// Types and schema for song comparison
export interface SongComparisonMetrics {
    commercialPotential: { score: number; justification: string };
    originality: { score: number; justification: string };
    composition: { score: number; justification: string };
    productionQuality: { score: number; justification: string };
    summary: string;
}

export interface ComparisonReport {
    overallWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    marketabilityWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    spotifyWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    song1Analysis: SongComparisonMetrics;
    song2Analysis: SongComparisonMetrics;
    recommendationsForSong1: string[];
    recommendationsForSong2: string[];
}

const songComparisonMetricsProperty = {
    type: Type.OBJECT,
    properties: {
        commercialPotential: { ...ratingProperty, description: "The song's potential for commercial success." },
        originality: { ...ratingProperty, description: "How unique and creative the song is." },
        composition: { ...ratingProperty, description: "The quality of the song's structure, melody, and harmony." },
        productionQuality: { ...ratingProperty, description: "A hypothetical assessment of the mix, mastering, and overall sound quality." },
        summary: { type: Type.STRING, description: "A brief 2-3 sentence summary of the song's strengths and weaknesses." }
    },
    required: ["commercialPotential", "originality", "composition", "productionQuality", "summary"]
};

const winnerProperty = {
    type: Type.OBJECT,
    properties: {
        song: { type: Type.STRING, description: "The winning song, either 'song1', 'song2', or 'tie'." },
        justification: { type: Type.STRING, description: "A detailed justification for why this song was chosen as the winner." }
    },
    required: ["song", "justification"]
};

const comparisonReportSchema = {
    type: Type.OBJECT,
    properties: {
        overallWinner: { ...winnerProperty, description: "The song that is better overall in terms of artistic and technical merit." },
        marketabilityWinner: { ...winnerProperty, description: "The song with higher commercial potential and broader appeal." },
        spotifyWinner: { ...winnerProperty, description: "The song better suited for popular Spotify playlists and streaming success." },
        song1Analysis: songComparisonMetricsProperty,
        song2Analysis: songComparisonMetricsProperty,
        recommendationsForSong1: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 actionable recommendations for improving Song 1."
        },
        recommendationsForSong2: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 actionable recommendations for improving Song 2."
        }
    },
    required: ["overallWinner", "marketabilityWinner", "spotifyWinner", "song1Analysis", "song2Analysis", "recommendationsForSong1", "recommendationsForSong2"]
};

export const compareSongs = async (
    song1Name: string,
    song1Genre: string,
    song1Vibe: string,
    song2Name: string,
    song2Genre: string,
    song2Vibe: string
): Promise<ComparisonReport> => {
    const fullPrompt = `Act as an expert A&R scout and music critic. You are given metadata for two songs. Your task is to provide a detailed, hypothetical comparison based on this information, as you cannot listen to the audio.

    **Song 1:**
    - File Name: "${song1Name}"
    - Genre: "${song1Genre}"
    - Description/Vibe: "${song1Vibe}"

    **Song 2:**
    - File Name: "${song2Name}"
    - Genre: "${song2Genre}"
    - Description/Vibe: "${song2Vibe}"

    **Your Task:**
    1.  **Declare Winners:** For each of the following categories, declare a clear winner ('song1', 'song2', or 'tie') and provide a strong justification.
        -   **Overall Winner:** The song with superior artistic and technical merit.
        -   **Marketability Winner:** The song with broader commercial appeal.
        -   **Spotify Winner:** The song better suited for popular streaming playlists.
    2.  **Detailed Analysis:** For each song, provide a detailed analysis including:
        -   Ratings from 1-100 for Commercial Potential, Originality, Composition, and hypothetical Production Quality, each with a brief justification.
        -   A concise summary of the song's strengths and weaknesses.
    3.  **Actionable Recommendations:** Provide 2-3 specific, constructive recommendations for improving each song.

    Your response must be strictly in the specified JSON format.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: comparisonReportSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ComparisonReport;
};

export const enhanceLyrics = async (originalLyrics: string): Promise<string> => {
    const prompt = `Act as an expert songwriter and lyricist. Your task is to enhance the following lyrics.
Focus on improving imagery, storytelling, rhythm, and emotional impact.
Maintain the original core theme and meaning, but elevate the language and structure.
Return ONLY the enhanced lyrics, formatted with sections like [Verse 1], [Chorus], etc.
Do not include any additional commentary, introductory phrases like "Here are the enhanced lyrics:", or markdown formatting.

Original Lyrics:
---
${originalLyrics}
---
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};

// Types and schema for chord progressions
export interface ChordProgression {
    progression: string;
    description: string;
}

const chordProgressionSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            progression: {
                type: Type.STRING,
                description: "A chord progression written as a series of chord names separated by dashes, like 'C-G-Am-F' or 'i-V-VI-IV'."
            },
            description: {
                type: Type.STRING,
                description: "A brief, one-sentence description of the progression's feel or common use case."
            }
        },
        required: ["progression", "description"]
    }
};

export const generateChordProgressions = async (
    key: string,
    genre: string,
    mood: string
): Promise<ChordProgression[]> => {
    const prompt = `Act as an expert music theorist and songwriter. Generate 5 unique and creative chord progressions based on the following parameters:
- Key: ${key}
- Genre: ${genre}
- Mood: ${mood}

For each progression, provide both the chord sequence and a brief description of its character. Ensure the chords are appropriate for the specified key.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: chordProgressionSchema,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ChordProgression[];
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createPcmBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp the values to the -1.0 to 1.0 range before converting
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const transcribeAudio = async (audioFile: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await audioFile.arrayBuffer();
            const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const targetSampleRate = 16000;
            const offlineContext = new OfflineAudioContext(
                originalBuffer.numberOfChannels,
                originalBuffer.duration * targetSampleRate,
                targetSampleRate
            );
            const source = offlineContext.createBufferSource();
            source.buffer = originalBuffer;
            source.connect(offlineContext.destination);
            source.start();

            const resampledBuffer = await offlineContext.startRendering();
            const pcmData = resampledBuffer.getChannelData(0); // Use mono
            
            let fullTranscription = '';
            let transcriptionComplete = false;

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const pcmBlob = createPcmBlob(pcmData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            fullTranscription += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            transcriptionComplete = true;
                            sessionPromise.then(session => session.close());
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live API Error:', e);
                        reject(new Error('Transcription failed due to a connection error.'));
                    },
                    onclose: (e: CloseEvent) => {
                        if (transcriptionComplete) {
                           resolve(fullTranscription.trim());
                        } else {
                           reject(new Error('Connection closed before transcription was complete.'));
                        }
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO], // Per API requirements
                    inputAudioTranscription: {},
                },
            });
            
        } catch (err) {
            console.error("Audio processing for transcription failed:", err);
            reject(new Error("Failed to process the audio file. It might be corrupted or in an unsupported format."));
        }
    });
};
