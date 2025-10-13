import { GoogleGenAI, Type, Modality, LiveServerMessage, Blob as GenAIBlob, GenerateContentResponse } from "@google/genai";
import { trackUsage } from './usageService';
import type { 
    SongData, 
    SongStructureAnalysis, 
    SingerGender, 
    ArtistType,
    ArtistStyleProfile,
    MelodyAnalysis,
    ChatMessage,
    AlbumConcept,
    YouTubeAssets,
    RemixResult,
    AnalysisReport,
    ComparisonReport,
    ChordProgression,
} from '../types';

export type { 
    SongData, 
    SongStructureAnalysis, 
    SingerGender, 
    ArtistType,
    ArtistStyleProfile,
    MelodyAnalysis,
    ChatMessage,
    AlbumConcept,
    YouTubeAssets,
    RemixResult,
    AnalysisReport,
    ComparisonReport,
    ChordProgression,
};

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

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
        genre: { type: Type.STRING, description: "The musical genre of the song (e.g., 'Synthwave', 'Indie Rock', 'Lo-fi Hip Hop')." },
        storyboard: { type: Type.STRING, description: "A cinematic storyboard script with scene descriptions, camera shots (e.g., WIDE SHOT, CLOSE UP), and actions based on the generated lyrics. Each scene should correspond to a section of the lyrics ([Verse 1], [Chorus], etc.). Format it like a screenplay." },
    },
    required: ["title", "artistName", "artistBio", "albumCoverPrompt", "lyrics", "styleGuide", "beatPattern", "singerGender", "artistType", "vocalMelody", "bpm", "genre", "storyboard"]
};

export const getStudioAssistantResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
    const contents = [...history, { role: 'user' as const, parts: [{ text: newMessage }] }];
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
             systemInstruction: 'You are Maestro, a helpful and friendly AI assistant for music creators. You are an expert in music theory, production, and songwriting. Provide concise, helpful, and inspiring answers. Format your answers with markdown.',
        }
    });

    const responseText = response.text;
    
    const inputChars = contents.reduce((sum, msg) => sum + (msg.parts[0].text.length), 0);

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: inputChars,
        outputChars: responseText.length,
        description: `Studio Assistant Chat`
    });

    return responseText;
};

const artistStyleProfileSchema = {
    type: Type.OBJECT,
    properties: {
        genre: { type: Type.STRING, description: "The primary musical genre." },
        singerGender: { type: Type.STRING, description: "The typical gender of the lead vocalist ('male', 'female', 'non-binary', 'any')." },
        artistType: { type: Type.STRING, description: "The type of artist ('solo', 'band', 'duo', 'any')." },
        mood: { type: Type.STRING, description: "The dominant mood or emotion of their music." },
        tempo: { type: Type.STRING, description: "The typical tempo range (e.g., 'Slow (60-80 BPM)')." },
        melody: { type: Type.STRING, description: "The common melodic style (e.g., 'Simple and Catchy')." },
        harmony: { type: Type.STRING, description: "The harmonic complexity (e.g., 'Diatonic and Simple')." },
        rhythm: { type: Type.STRING, description: "The rhythmic feel (e.g., 'Syncopated and Funky')." },
        instrumentation: { type: Type.STRING, description: "The key instruments used (e.g., 'Synth-heavy')." },
        atmosphere: { type: Type.STRING, description: "The sonic atmosphere created by effects (e.g., 'Spacious and Reverb-heavy')." },
        vocalStyle: { type: Type.STRING, description: "The typical vocal performance style (e.g., 'Clear & Melodic')." },
    },
    required: ["genre", "singerGender", "artistType", "mood", "tempo", "melody", "harmony", "rhythm", "instrumentation", "atmosphere", "vocalStyle"]
};

export const generateProfileFromArtistName = async (artistName: string): Promise<ArtistStyleProfile> => {
    const prompt = `Analyze the musical style of the artist "${artistName}". Based on your analysis, generate a detailed "Artist Style Profile". Fill out all fields of the JSON schema accurately to represent their signature sound.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: artistStyleProfileSchema,
        },
    });

    const jsonText = response.text.trim();
    const profile = JSON.parse(jsonText) as ArtistStyleProfile;
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Generate Profile for: ${artistName}`
    });

    return profile;
};

const remixResultSchema = {
    type: Type.OBJECT,
    properties: {
        newCreativePrompt: {
            type: Type.STRING,
            description: "A new, creative, one-sentence song prompt that creatively combines the user's Primary Creative Direction with the Target Genre."
        },
        profile: artistStyleProfileSchema,
    },
    required: ["newCreativePrompt", "profile"]
};


export const remixArtistStyleProfile = async (
    originalProfile: ArtistStyleProfile,
    targetGenre: string,
    remixPrompt: string
): Promise<RemixResult> => {

    const prompt = `Act as an expert musicologist and producer. Your task is to first generate a NEW, creative one-sentence song prompt that creatively combines the user's **Primary Creative Direction** with the **Target Genre**. Then, based on that NEW prompt, generate a full Artist Style Profile.

    **Primary Creative Direction:** "${remixPrompt || 'No specific prompt provided.'}"
    **Original Artist Style Profile (Secondary Inspiration):**
    \`\`\`json
    ${JSON.stringify(originalProfile, null, 2)}
    \`\`\`
    **Target Genre:** ${targetGenre}

    **Instructions:**
    1.  First, create a \`newCreativePrompt\`. This should be a fresh, inspiring, one-sentence idea blending the user's prompt (if provided) and the target genre. It should be a complete thought.
    2.  Using that \`newCreativePrompt\` as the main inspiration, generate a complete Artist Style Profile under the \`profile\` key.
    3.  The \`genre\` field inside the final \`profile\` must be exactly "${targetGenre}".
    4.  The final output must be a single JSON object matching the provided schema, containing both the \`newCreativePrompt\` and the full \`profile\`.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: remixResultSchema,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as RemixResult;
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Remix Style Profile to ${targetGenre}`
    });

    return result;
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
    const songData = JSON.parse(jsonText) as SongData;

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: jsonText.length,
        description: `Generate Song: ${songData.title}`
    });

    return songData;
};

// New schema for album name suggestions
const albumNameSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        names: {
            type: Type.ARRAY,
            description: "A list of 5 creative and fitting album names based on the provided concept, artist, and genre.",
            items: { type: Type.STRING }
        }
    },
    required: ["names"]
};

// New service function for generating album names
export const generateAlbumNames = async (
    artistName: string,
    albumConcept: string,
    genre: string
): Promise<string[]> => {
    const prompt = `Based on the following artist, concept, and genre, generate 5 creative and fitting album name suggestions.

    **Artist Name:** "${artistName}"
    **Album Concept:** "${albumConcept}"
    **Genre:** ${genre}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: albumNameSuggestionsSchema,
        },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as { names: string[] };

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Generate Album Names for: ${artistName}`
    });

    return result.names;
};

// New schema for album details
const albumConceptSchema = {
    type: Type.OBJECT,
    properties: {
        artistBio: { type: Type.STRING, description: "A short, creative biography for the provided artist, fitting their style and the album's theme." },
        albumCoverPrompt: { type: Type.STRING, description: "A detailed, artistic prompt for an image generation model to create an album cover. If the user provides their own image, this field should contain the text 'User-provided image.'." },
        artistImagePrompt: { type: Type.STRING, description: "A detailed, artistic prompt for an image generation model to create a portrait or photo of the artist, based on their name, bio, and genre. For example: 'Photo of a mysterious solo synthwave artist, mid-30s, wearing a retro jacket with neon trim, looking out over a futuristic city at night.'" }
    },
    required: ["artistBio", "albumCoverPrompt", "artistImagePrompt"]
};


// New service function for albums
export const generateAlbumConcept = async (
    prompt: string,
    genre: string, 
    albumName: string, 
    artistName: string,
    shouldGenerateCoverPrompt: boolean
): Promise<AlbumConcept> => {
    
    const coverPromptInstruction = shouldGenerateCoverPrompt 
        ? "You MUST generate a detailed 'albumCoverPrompt' based on the album concept." 
        : "The user has provided their own album cover. For the 'albumCoverPrompt' field, you MUST return the exact string 'User-provided image.'";

    const fullPrompt = `Based on the following album idea and parameters, generate the required details.

    **Album Name:** "${albumName}"
    **Artist Name:** "${artistName}"
    **Album Idea/Concept:** "${prompt}"
    **Genre:** ${genre}

    **Instructions:**
    1.  Generate a creative 'artistBio' for the provided artist that fits the album concept and genre.
    2.  ${coverPromptInstruction}
    3.  You MUST generate a detailed 'artistImagePrompt' to create a portrait of the artist. This should be based on their name, bio, and genre.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: albumConceptSchema,
        },
    });

    const jsonText = response.text.trim();
    const albumConcept = JSON.parse(jsonText) as AlbumConcept;
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: jsonText.length,
        description: `Generate Album Concept: ${albumName}`
    });

    return albumConcept;
};


export const generateRemixedSong = async (
    originalTitle: string,
    originalArtist: string,
    targetGenre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    mood: string,
    remixPrompt: string,
): Promise<SongData> => {
    
    const remixInstruction = remixPrompt ? `\n**Creative Direction:** "${remixPrompt}"\nThis should heavily influence the new lyrics, instrumentation, and overall vibe.` : '';

    const fullPrompt = `Act as an expert music producer and songwriter specializing in recreating songs for different eras. Your task is to reimagine a song based on the provided inspiration and parameters. The new song should capture the core theme and emotional essence of the original but be completely new in its composition, lyrics, and production style, fitting perfectly into the target genre. Do not copy lyrics or melodies from the original.

    **Inspiration Song:** "${originalTitle}" by ${originalArtist}

    **Target Style:**
    - **Genre:** ${targetGenre}
    - **Singer:** ${singerGender}
    - **Artist Type:** ${artistType}
    - **Mood:** ${mood}
    ${remixInstruction}

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
    const songData = JSON.parse(jsonText) as SongData;

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: jsonText.length,
        description: `Remix Song: ${originalTitle}`
    });
    
    return songData;
};

export const generateRemixedSongFromLyrics = async (
    originalLyrics: string,
    originalFileName: string,
    targetGenre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    mood: string,
    remixPrompt: string,
): Promise<SongData> => {
    
    const remixInstruction = remixPrompt ? `\n**Creative Direction:** "${remixPrompt}"\nThis should heavily influence the new lyrics, instrumentation, and overall vibe.` : '';

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
    ${remixInstruction}

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
    const songData = JSON.parse(jsonText) as SongData;

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: jsonText.length,
        description: `Remix from lyrics: ${originalFileName}`
    });
    
    return songData;
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
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'multimodal',
        inputChars: textPart.text.length,
        outputChars: jsonText.length,
        description: 'Hum-to-Melody Transcription'
    });
    
    return JSON.parse(jsonText) as MelodyAnalysis;
};


export const generateNewBeatPattern = async (promptText: string): Promise<string> => {
    const prompt = `Generate ONLY a JSON string for a 16-step drum pattern for the following description: "${promptText}".
        The JSON must only contain keys for 'kick', 'snare', 'hihat', and 'clap', with values being arrays of integers from 0 to 15.
        Example format: '{"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14]}'
        Do not include any other text, explanations, or markdown formatting. The entire output must be a valid JSON string.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: cleanedText.length,
        description: 'Generate Beat Pattern'
    });

    return cleanedText;
};

export const generateBeatFromAudio = async (audioBlob: Blob): Promise<string> => {
    const base64Audio = await blobToBase64(audioBlob);

    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio,
        },
    };

    const textPart = {
        text: `Analyze the rhythm, tempo, style, and feel of this audio file. Based on your analysis, generate a complementary 16-step drum pattern.
        The output must be ONLY a JSON string. The JSON must only contain keys for 'kick', 'snare', 'hihat', and 'clap', with values being arrays of integers from 0 to 15.
        Example format: '{"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14]}'
        Do not include any other text, explanations, or markdown formatting.`
    };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
    });
    
    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'multimodal',
        inputChars: textPart.text.length,
        outputChars: cleanedText.length,
        description: 'Generate Beat from Audio'
    });
    
    return cleanedText;
};


export const evolveBeatPattern = async (pattern: string, instruction: string): Promise<string> => {
    const prompt = `You are an expert drum machine programmer. I will provide you with a 16-step drum pattern in JSON format and an instruction.
Your task is to modify the pattern according to the instruction and return ONLY the new, valid JSON pattern.
Keep the structure of the JSON the same (keys: kick, snare, hihat, clap; values: arrays of numbers 0-15). Do not add any explanatory text or markdown.

Instruction: "${instruction}"

Existing Pattern:
${pattern}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const cleanedText = response.text.replace(/```json\n?|\n?```/g, '').trim();

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: cleanedText.length,
        description: 'Evolve Beat Pattern'
    });

    return cleanedText;
};


export const generateStorylines = async (topic: string): Promise<string[]> => {
    const prompt = `Generate 5 creative, one-sentence song storylines based on the topic: "${topic}".`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: response.text.length,
        description: 'Generate Storylines'
    });
    // Split by newlines and filter out any empty lines or list markers.
    return response.text.split('\n').map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
};

export const generateRandomSongPrompt = async (): Promise<string> => {
    const prompt = "Generate a single, creative, interesting, and unique one-sentence song idea or storyline. Be imaginative. For example: 'A time traveler falls in love with a ghost from a past they can't change.' or 'An AI running a city discovers the last surviving tree.'";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            temperature: 0.9,
        }
    });
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: response.text.length,
        description: 'Generate Random Song Prompt'
    });

    return response.text.replace(/^["']|["']$/g, '').trim();
};

export const exploreSong = async (title: string, lyrics: string): Promise<GenerateContentResponse> => {
    const prompt = `Act as an expert musicologist and music historian.
    Based on the following song information, find and provide a detailed summary using your search tool.
    
    Song Title: "${title}"
    Lyrics Snippet (if provided): "${lyrics || 'Not provided.'}"

    Please provide a comprehensive summary including the following details if available:
    - **Artist**: The primary recording artist(s).
    - **Album**: The album the song was released on.
    - **Release Year**: The year the song was originally released.
    - **Genre(s)**: The main genres and subgenres.
    - **Songwriter(s)**: The credited writers of the music and lyrics.
    - **Producer(s)**: The credited producers.
    - **Interesting Facts**: Any notable awards, chart performance, cultural impact, or behind-the-scenes stories.
    
    Format your entire response using Markdown for clear readability.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: response.text.length,
        description: `Song Explorer: ${title}`
    });

    return response;
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

    trackUsage({
        model: 'imagen-4.0-generate-001',
        type: 'image',
        count: 1,
        description: `Image: ${prompt.substring(0, 50)}...`
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
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
    
    trackUsage({
        model: 'gemini-2.5-flash-image',
        type: 'image',
        count: 1,
        description: `Edit Image: ${prompt.substring(0, 50)}...`
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const newBase64 = part.inlineData.data;
            const newMimeType = part.inlineData.mimeType;
            return `data:${newMimeType};base64,${newBase64}`;
        }
    }
    throw new Error("The AI did not return an edited image. It may have responded: " + response.text);
};

const youtubeAssetsSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A catchy, SEO-friendly YouTube video title for the song."
        },
        description: {
            type: Type.STRING,
            description: "A well-structured YouTube video description. It should include sections for the song details, lyrics, artist links, and relevant hashtags. Use markdown for formatting."
        },
        tags: {
            type: Type.ARRAY,
            description: "A list of 15-20 relevant YouTube tags (keywords), including long-tail keywords, genre, mood, and artist name.",
            items: { type: Type.STRING }
        },
        thumbnailPrompts: {
            type: Type.ARRAY,
            description: "An array of 3 distinct, creative, and detailed prompts for an image generation model to create a YouTube thumbnail. The prompts should be visually descriptive and compelling.",
            items: { type: Type.STRING }
        }
    },
    required: ["title", "description", "tags", "thumbnailPrompts"]
};

export const generateYouTubeAssets = async (
    songTitle: string,
    artistName: string,
    genre: string,
    vibe: string
): Promise<YouTubeAssets> => {
    const prompt = `Act as a YouTube music promotion expert. Your task is to generate a complete set of YouTube assets for a new song release.

    **Song Details:**
    - **Title:** "${songTitle}"
    - **Artist:** "${artistName}"
    - **Genre:** ${genre}
    - **Vibe/Description:** "${vibe || 'Not provided. Infer from other details.'}"

    **Instructions:**
    1.  Create a catchy and SEO-optimized \`title\` for the YouTube video.
    2.  Write a comprehensive \`description\`. Include placeholders like "[Link to Spotify]", "[Artist Website]", etc. and use hashtags.
    3.  Generate a list of 15-20 effective \`tags\`.
    4.  Come up with 3 diverse and visually striking \`thumbnailPrompts\` for an AI image generator. These should describe scenes, not just abstract concepts. For example: "Epic fantasy landscape painting of a lone knight watching a glowing city under a purple nebula, digital art, high detail, cinematic lighting."

    Provide the output in the specified JSON format.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: youtubeAssetsSchema,
        },
    });

    const jsonText = response.text.trim();
    const assets = JSON.parse(jsonText) as YouTubeAssets;

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Generate YouTube Assets for: ${songTitle}`
    });

    return assets;
};

const ratingProperty = { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, justification: { type: Type.STRING } }, required: ["score", "justification"] };
const analysisReportSchema = {
    type: Type.OBJECT,
    properties: {
        ratings: { type: Type.OBJECT, properties: { commercialPotential: { ...ratingProperty }, originality: { ...ratingProperty }, composition: { ...ratingProperty }, productionQuality: { ...ratingProperty } }, required: ["commercialPotential", "originality", "composition", "productionQuality"] },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
        summary: { type: Type.STRING },
        marketability: { type: Type.OBJECT, properties: { targetAudience: { type: Type.STRING }, playlistFit: { type: Type.ARRAY, items: { type: Type.STRING } }, syncPotential: { type: Type.STRING } }, required: ["targetAudience", "playlistFit", "syncPotential"] }
    },
    required: ["ratings", "pros", "cons", "summary", "marketability"]
};
export const analyzeSong = async (fileName: string, genre: string, description: string): Promise<AnalysisReport> => {
    const prompt = `Act as an expert A&R scout and music critic. Based on the following information about a song, provide a detailed analysis. The analysis should be hypothetical. File Name: "${fileName}", Genre: "${genre}", Description: "${description}". Your analysis must include: Overall Scorecard, Pros & Cons, and Marketability.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: analysisReportSchema } });
    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: `Analyze Song: ${fileName}` });
    return JSON.parse(jsonText) as AnalysisReport;
};

const winnerProperty = { type: Type.OBJECT, properties: { song: { type: Type.STRING }, justification: { type: Type.STRING } }, required: ["song", "justification"] };
const songComparisonMetricsProperty = { type: Type.OBJECT, properties: { commercialPotential: { ...ratingProperty }, originality: { ...ratingProperty }, composition: { ...ratingProperty }, productionQuality: { ...ratingProperty }, summary: { type: Type.STRING } }, required: ["commercialPotential", "originality", "composition", "productionQuality", "summary"] };
const comparisonReportSchema = { type: Type.OBJECT, properties: { overallWinner: { ...winnerProperty }, marketabilityWinner: { ...winnerProperty }, spotifyWinner: { ...winnerProperty }, song1Analysis: songComparisonMetricsProperty, song2Analysis: songComparisonMetricsProperty, recommendationsForSong1: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendationsForSong2: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["overallWinner", "marketabilityWinner", "spotifyWinner", "song1Analysis", "song2Analysis", "recommendationsForSong1", "recommendationsForSong2"] };
export const compareSongs = async (song1Name: string, song1Genre: string, song1Vibe: string, song2Name: string, song2Genre: string, song2Vibe: string): Promise<ComparisonReport> => {
    const fullPrompt = `Act as an expert A&R scout. Provide a detailed, hypothetical comparison of two songs. Song 1: "${song1Name}" (Genre: ${song1Genre}, Vibe: ${song1Vibe}). Song 2: "${song2Name}" (Genre: ${song2Genre}, Vibe: ${song2Vibe}). Your task: Declare winners for Overall, Marketability, and Spotify Potential. Provide detailed analysis and recommendations for each song.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: fullPrompt, config: { responseMimeType: "application/json", responseSchema: comparisonReportSchema } });
    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: fullPrompt.length, outputChars: jsonText.length, description: `Compare: ${song1Name} vs ${song2Name}` });
    return JSON.parse(jsonText) as ComparisonReport;
};

export const enhanceLyrics = async (originalLyrics: string): Promise<string> => {
    const prompt = `Act as an expert lyricist. Enhance the following lyrics, focusing on improving imagery, storytelling, and emotional impact, while maintaining the core theme. Return ONLY the enhanced lyrics. Original Lyrics:\n---\n${originalLyrics}\n---`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: response.text.length, description: 'Enhance Lyrics' });
    return response.text.trim();
};

const chordProgressionSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { progression: { type: Type.STRING }, description: { type: Type.STRING }, theoryExplanation: { type: Type.STRING } }, required: ["progression", "description", "theoryExplanation"] } };
export const generateChordProgressions = async (key: string, genre: string, mood: string): Promise<ChordProgression[]> => {
    const prompt = `Act as an expert music theorist. Generate 5 unique chord progressions for Key: ${key}, Genre: ${genre}, Mood: ${mood}. For each, provide the chord sequence, a brief description, and a 1-2 sentence music theory explanation.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: chordProgressionSchema } });
    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: 'Generate Chords' });
    return JSON.parse(jsonText) as ChordProgression[];
};

const songStructureSchema = {
    type: Type.OBJECT,
    properties: {
        overallFeedback: {
            type: Type.STRING,
            description: "Provide 2-3 sentences of high-level feedback on the song's structure, flow, and potential. Mention its strengths and areas for improvement."
        },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: {
                        type: Type.STRING,
                        description: "The identified type of the song section (e.g., 'Verse 1', 'Chorus', 'Bridge', 'Outro')."
                    },
                    lyrics: {
                        type: Type.STRING,
                        description: "The exact lyrics of this section, preserving original line breaks."
                    },
                    suggestion: {
                        type: Type.STRING,
                        description: "A specific, actionable suggestion to improve this section's impact, clarity, or structure. If no suggestion is needed, this can be omitted."
                    }
                },
                required: ["type", "lyrics"]
            }
        }
    },
    required: ["overallFeedback", "sections"]
};


export const analyzeSongStructure = async (lyrics: string): Promise<SongStructureAnalysis> => {
    const prompt = `Act as an expert songwriter and music producer. Analyze the structure of the following song lyrics. Your task is to:
1.  Identify and label each distinct section (e.g., Verse 1, Chorus, Pre-Chorus, Bridge, Outro).
2.  Provide overall feedback on the song's structure and flow.
3.  For each section, offer a concise, actionable suggestion for improvement if applicable (e.g., "Consider adding a rhyming couplet here for stronger impact," or "This could be a great place for a pre-chorus to build anticipation."). If a section is strong, no suggestion is needed.
Return the analysis in the specified JSON format.

Lyrics to analyze:
---
${lyrics}
---`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: songStructureSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: 'Analyze Song Structure' });
    return JSON.parse(jsonText) as SongStructureAnalysis;
};


export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


export function createPcmBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    // The correct conversion for 16-bit signed PCM.
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
            const offlineContext = new OfflineAudioContext( originalBuffer.numberOfChannels, originalBuffer.duration * targetSampleRate, targetSampleRate );
            const source = offlineContext.createBufferSource();
            source.buffer = originalBuffer;
            source.connect(offlineContext.destination);
            source.start();
            const resampledBuffer = await offlineContext.startRendering();
            const pcmData = resampledBuffer.getChannelData(0);
            
            let fullTranscription = '';
            let transcriptionComplete = false;
            
            trackUsage({ model: 'gemini-2.5-flash-native-audio-preview-09-2025', type: 'audio', seconds: originalBuffer.duration, description: `Transcribe: ${audioFile.name}` });
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const pcmBlob = createPcmBlob(pcmData);
                        sessionPromise.then((session) => { session.sendRealtimeInput({ media: pcmBlob }); });
                    },
                    onmessage: (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) fullTranscription += message.serverContent.inputTranscription.text;
                        if (message.serverContent?.turnComplete) { transcriptionComplete = true; sessionPromise.then(session => session.close()); }
                    },
                    onerror: (e: ErrorEvent) => { reject(new Error('Transcription failed due to a connection error.')); },
                    onclose: (e: CloseEvent) => {
                        if (transcriptionComplete) resolve(fullTranscription.trim());
                        else reject(new Error('Connection closed before transcription was complete.'));
                    },
                },
                config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {} },
            });
        } catch (err) {
            reject(new Error("Failed to process the audio file."));
        }
    });
};

const audioAnalysisProfileSchema = { type: Type.OBJECT, properties: { genre: { type: Type.STRING }, singerGender: { type: Type.STRING }, artistType: { type: Type.STRING }, mood: { type: Type.STRING }, tempo: { type: Type.STRING }, melody: { type: Type.STRING }, harmony: { type: Type.STRING }, rhythm: { type: Type.STRING }, instrumentation: { type: Type.STRING }, atmosphere: { type: Type.STRING }, vocalStyle: { type: Type.STRING }, artistNameSuggestion: { type: Type.STRING } }, required: ["genre", "singerGender", "artistType", "mood", "tempo", "melody", "harmony", "rhythm", "instrumentation", "atmosphere", "vocalStyle", "artistNameSuggestion"] };
export const analyzeAudioForProfile = async (audioBlob: Blob): Promise<ArtistStyleProfile & { artistNameSuggestion: string }> => {
    const base64Audio = await blobToBase64(audioBlob);
    const audioPart = { inlineData: { mimeType: audioBlob.type, data: base64Audio } };
    const textPart = { text: `You are an expert music A&R scout.Analyze the provided audio file and generate a detailed "Artist Style Profile". Suggest a creative and plausible artist name. The output must be ONLY a single JSON object.` };
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { parts: [audioPart, textPart] }, config: { responseMimeType: "application/json", responseSchema: audioAnalysisProfileSchema } });
    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'multimodal', inputChars: textPart.text.length, outputChars: jsonText.length, description: `Analyze Audio for Profile: ${(audioBlob as any).name || 'audio blob'}` });
    return JSON.parse(jsonText) as ArtistStyleProfile & { artistNameSuggestion: string };
};