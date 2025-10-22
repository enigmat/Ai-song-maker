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
    RolloutPlan,
    ListenerProfile,
    PressRelease,
    SocialMediaKit,
    ArtistPersona,
    SoundPackItem,
    BridgeOption,
    MixdownReport,
    MerchKit,
    VocalAnalysis,
    VocalComparison,
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
    RolloutPlan,
    ListenerProfile,
    PressRelease,
    SocialMediaKit,
    ArtistPersona,
    SoundPackItem,
    BridgeOption,
    MixdownReport,
    MerchKit,
    VocalAnalysis,
    VocalComparison,
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
        artistType: { type: Type.STRING, description: "The type of artist ('solo', 'band', 'duet', or 'any')." },
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
        artistType: { type: Type.STRING, description: "The type of artist ('solo', 'band', 'duet', 'any')." },
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

const artistPersonaSchema = {
    type: Type.OBJECT,
    properties: {
        artistName: { type: Type.STRING, description: "A creative and plausible name for the artist or band." },
        artistBio: { type: Type.STRING, description: "A detailed and engaging biography for the artist, fitting their persona and style. It should be at least two paragraphs long." },
        artistImagePrompt: { type: Type.STRING, description: "A detailed, artistic prompt for an image generation model to create a compelling portrait or photo of the artist. The prompt should describe the artist's appearance, clothing, setting, mood, and photographic style (e.g., 'Close-up photo of a mysterious solo synthwave artist, mid-30s, wearing a retro jacket with neon trim, looking out over a futuristic city at night, moody lighting, anamorphic lens flare.')." },
        visualIdentityPrompt: { type: Type.STRING, description: "A general prompt describing the artist's overall visual brand identity, suitable for creating logos, merchandise, or other brand assets. e.g., 'Minimalist and geometric, using triangles and muted neon colors. A feeling of retro-futurism and melancholy.'" },
        styleProfile: artistStyleProfileSchema,
        signatureSongConcepts: {
            type: Type.ARRAY,
            description: "A list of 3 to 5 creative, one-sentence song concepts or titles that this artist would create, fitting their style and bio.",
            items: { type: Type.STRING }
        }
    },
    required: ["artistName", "artistBio", "artistImagePrompt", "visualIdentityPrompt", "styleProfile", "signatureSongConcepts"]
};

export const generateArtistPersona = async (
    prompt: string,
    genre: string,
    singerGender: SingerGender,
    artistType: ArtistType,
    artistName?: string,
    trackName?: string
): Promise<ArtistPersona> => {
    const fullPrompt = `Act as an expert A&R executive and creative director. Based on the following user idea and constraints, generate a complete and cohesive artist persona.

    **User Idea:** "${prompt}"
    ${trackName ? `\n**Inspirational Song Idea:** "${trackName}"\nThis song idea should heavily influence the artist's bio and their signature song concepts.` : ''}

    **Constraints:**
    - Genre: ${genre}
    - Singer: ${singerGender}
    - Artist Type: ${artistType}
    ${artistName ? `- Artist Name: You MUST use the name "${artistName}".` : '- Artist Name: Create a unique and fitting name.'}

    **Instructions:**
    1.  Create the artist's name based on the constraint above.
    2.  Write a detailed \`artistBio\` of at least two paragraphs that fits the idea and constraints.
    3.  Generate a highly specific \`artistImagePrompt\` to create a portrait of the artist.
    4.  Create a broader \`visualIdentityPrompt\` for the artist's brand.
    5.  Fill out a complete \`styleProfile\` that musically defines the artist's sound, strictly adhering to the provided Genre, Singer, and Artist Type constraints.
    6.  Provide a list of 3-5 \`signatureSongConcepts\` that this artist would write about. ${trackName ? 'If a song idea was provided, one of these concepts should be it or be very similar.' : ''}

    The entire output must be a single JSON object that strictly adheres to the provided schema.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: artistPersonaSchema,
        },
    });

    const jsonText = response.text.trim();
    const artistPersona = JSON.parse(jsonText) as ArtistPersona;

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: jsonText.length,
        description: `Generate Artist Persona for: ${prompt.substring(0, 30)}...`
    });

    return artistPersona;
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
            responseModalities: [Modality.IMAGE],
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
export const analyzeSong = async (fileName: string, artistName: string, artistType: string, targetAudience: string): Promise<AnalysisReport> => {
    const prompt = `Act as an expert A&R scout and music critic. Based on the following information about a song, provide a detailed analysis. The analysis should be hypothetical. 
    
    **File Name:** "${fileName}"
    **Artist Name:** "${artistName}"
    **Artist Type:** "${artistType}"
    **Target Audience Description:** "${targetAudience}"
    
    Your analysis must include: Overall Scorecard (Commercial Potential, Originality, Composition, Production Quality), Pros & Cons, and Marketability (Target Audience, Playlist Fit, Sync Potential). Use the artist's description of their target audience to inform your marketability assessment.`;
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

const rolloutPlanSchema = {
    type: Type.OBJECT,
    properties: {
        rollout: {
            type: Type.ARRAY,
            description: "A detailed timeline of tasks leading up to and following the release.",
            items: {
                type: Type.OBJECT,
                properties: {
                    timeframe: { type: Type.STRING, description: "e.g., '6 Weeks Before Release'" },
                    tasks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                task: { type: Type.STRING, description: "The title of the task." },
                                description: { type: Type.STRING, description: "A brief explanation of the task." }
                            },
                            required: ["task", "description"]
                        }
                    }
                },
                required: ["timeframe", "tasks"]
            }
        },
        socialMediaContent: {
            type: Type.ARRAY,
            description: "Specific content ideas for various social media platforms, incorporating user-selected ideas where provided.",
            items: {
                type: Type.OBJECT,
                properties: {
                    platform: { type: Type.STRING, description: "e.g., 'Instagram', 'TikTok'" },
                    ideas: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["platform", "ideas"]
            }
        },
        emailSnippets: {
            type: Type.ARRAY,
            description: "Ready-to-use email newsletter snippets for different stages of the campaign.",
            items: {
                type: Type.OBJECT,
                properties: {
                    subject: { type: Type.STRING, description: "The email subject line." },
                    body: { type: Type.STRING, description: "The email body content." }
                },
                required: ["subject", "body"]
            }
        }
    },
    required: ["rollout", "socialMediaContent", "emailSnippets"]
};

export const generateRolloutPlan = async (
    songTitle: string, 
    artistName: string, 
    artistType: string, 
    releaseDate: string, 
    targetAudience: string,
    selectedContentIdeas: string[]
): Promise<RolloutPlan> => {

    const selectedIdeasPrompt = selectedContentIdeas.length > 0
        ? `\n**User-Selected Content Ideas:** Critically, you MUST incorporate the following user-selected ideas into your 'socialMediaContent' section, expanding on them or assigning them to appropriate platforms:\n- ${selectedContentIdeas.join('\n- ')}\n`
        : '';
    
    const prompt = `Act as an expert music marketing and promotion manager. Generate a comprehensive music rollout plan for a new single. The plan must include three main sections: a detailed timeline, social media content ideas, and email newsletter snippets.

    **Song & Artist Details:**
    - Title: "${songTitle}"
    - Artist: "${artistName}"
    - Artist Type: ${artistType}
    - Planned Release Date: ${releaseDate || 'Not specified. Create a generic 8-week timeline.'}
    - Target Audience: "${targetAudience || 'Not provided. Infer from other details.'}"
    ${selectedIdeasPrompt}
    **Instructions:**
    1.  For the 'rollout' timeline, create actionable tasks for key periods relative to the release date (e.g., 8 Weeks Before, 6 Weeks Before, 4 Weeks Before, 2 Weeks Before, 1 Week Before, Release Week, and Post-Release).
    2.  For 'socialMediaContent', provide 3-4 specific, creative post ideas for each of these platforms: Instagram, TikTok, and Twitter/X, tailored to the target audience. If user-selected ideas are provided, you must integrate them.
    3.  For 'emailSnippets', provide 2-3 distinct emails for different stages of the campaign (e.g., announcement, reminder, release day).
    
    Return the entire plan in the specified JSON format.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: rolloutPlanSchema,
        },
    });
    
    const jsonText = response.text.trim();
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Generate Rollout Plan for: ${songTitle}`
    });
    return JSON.parse(jsonText) as RolloutPlan;
};

const listenerProfileSchema = {
    type: Type.OBJECT,
    properties: {
        archetypeName: { type: Type.STRING, description: "A creative and evocative name for this ideal listener archetype, like 'The Neo-Retro Navigator' or 'The Urban Explorer'." },
        description: { type: Type.STRING, description: "A rich, descriptive paragraph summarizing this listener's personality, worldview, and relationship with music." },
        demographics: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title for this section, which must be 'Demographics'." },
                details: {
                    type: Type.ARRAY,
                    description: "A list of bullet points detailing the listener's demographic information, such as age, location, occupation, and income.",
                    items: { type: Type.STRING }
                }
            },
            required: ["title", "details"]
        },
        psychographics: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title for this section, which must be 'Psychographics'." },
                details: {
                    type: Type.ARRAY,
                    description: "A list of bullet points describing the listener's values, interests, lifestyle, and motivations.",
                    items: { type: Type.STRING }
                }
            },
            required: ["title", "details"]
        },
        musicHabits: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "The title for this section, which must be 'Music Habits'." },
                details: {
                    type: Type.ARRAY,
                    description: "A list of bullet points explaining how, where, and why the listener engages with music, including discovery methods and live event attendance.",
                    items: { type: Type.STRING }
                }
            },
            required: ["title", "details"]
        }
    },
    required: ["archetypeName", "description", "demographics", "psychographics", "musicHabits"]
};

export const generateListenerProfile = async (
    artistName: string,
    artistType: string,
    songName: string,
    audienceDescription: string
): Promise<ListenerProfile> => {
    const prompt = `Act as an expert music marketer and audience researcher. Based on the provided details, create a rich and detailed "Ideal Listener" profile. This profile should be a vivid and actionable persona that the artist can use for marketing.

    **Artist Name:** "${artistName}"
    **Artist Type:** ${artistType}
    **Song Name:** "${songName}"
    **Artist's Description of Target Audience:** "${audienceDescription}"

    **Instructions:**
    1.  Create a compelling \`archetypeName\` for this listener (e.g., "The Neo-Retro Navigator").
    2.  Write a summary \`description\` paragraph that brings the persona to life.
    3.  Fill out the \`demographics\`, \`psychographics\`, and \`musicHabits\` sections with several detailed bullet points each.
    4.  The final output must be a single JSON object matching the provided schema exactly.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: listenerProfileSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: `Generate Listener Profile for: ${artistName}` });
    return JSON.parse(jsonText) as ListenerProfile;
};

const contentIdeasSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            description: "A list of 20 creative, short-form video content ideas tailored to the song, artist, and audience. Ideas should be suitable for platforms like TikTok, Instagram Reels, and YouTube Shorts. Each idea should be a short, actionable sentence.",
            items: { type: Type.STRING }
        }
    },
    required: ["ideas"]
};

export const generateContentIdeas = async (songName: string, artistName: string, artistType: string, targetAudience: string): Promise<string[]> => {
    const prompt = `Act as a viral marketing expert for musicians. Based on the provided song and artist details, generate a list of 20 creative, concise, and actionable content ideas for short-form video platforms like TikTok, Instagram Reels, and YouTube Shorts.

    **Song Name:** "${songName}"
    **Artist Name:** "${artistName}"
    **Artist Type:** ${artistType}
    **Target Audience:** "${targetAudience}"

    **Instructions:**
    - The ideas should be diverse, covering trends, behind-the-scenes, storytelling, and direct engagement.
    - Each idea must be a single, short sentence.
    - Tailor the ideas to the described target audience.
    - Return the list of 20 ideas in the specified JSON format.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: contentIdeasSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: `Generate Content Ideas for: ${songName}` });
    const result = JSON.parse(jsonText) as { ideas: string[] };
    return result.ideas;
};

const pressReleaseSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A catchy, professional headline for the press release." },
        dateline: { type: Type.STRING, description: "The city and state for the dateline, e.g., 'LOS ANGELES, CA'. Do not include the date." },
        introduction: { type: Type.STRING, description: "The compelling introductory paragraph (the lead). Must include artist name, release title, and release date." },
        body: { type: Type.STRING, description: "Two to three paragraphs providing more detail about the song/album, its creation, themes, and sound. Use professional language. Use '\\n\\n' to separate paragraphs." },
        quote: { type: Type.STRING, description: "An insightful and engaging quote from the artist about the music." },
        aboutArtist: { type: Type.STRING, description: "A concise 'About the Artist' boilerplate paragraph." },
        callToAction: { type: Type.STRING, description: "A concluding sentence or two telling the reader where to find the music." },
    },
    required: ["headline", "dateline", "introduction", "body", "quote", "aboutArtist", "callToAction"]
};

export const generatePressRelease = async (
    artistName: string,
    releaseTitle: string,
    releaseDate: string,
    story: string,
    keywords: string,
    links: string
): Promise<PressRelease> => {
    const prompt = `Act as an expert music publicist. Write a professional and engaging press release for an upcoming music release. Adhere strictly to the standard press release format.

    **Artist Name:** ${artistName}
    **Release Title:** ${releaseTitle}
    **Release Date:** ${releaseDate}
    **The Story / Key Details:** ${story}
    **Descriptive Keywords:** ${keywords}
    **Relevant Links (for context, do not include in the main body):** ${links}
    
    **Instructions:**
    1.  Create a compelling \`headline\`.
    2.  Generate a \`dateline\` (City, ST only).
    3.  Write a strong \`introduction\` that includes the artist, title, and release date.
    4.  Develop the \`body\` with 2-3 paragraphs expanding on the story and keywords.
    5.  Create a plausible artist \`quote\`.
    6.  Write a concise \`aboutArtist\` boilerplate.
    7.  End with a clear \`callToAction\`.
    
    Return the entire press release in the specified JSON format.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: pressReleaseSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Generate Press Release for: ${releaseTitle}`
    });
    return JSON.parse(jsonText) as PressRelease;
};

export const generateSocialMediaKit = async (prompt: string, artistName: string, releaseTitle: string): Promise<SocialMediaKit> => {
    const model = 'imagen-4.0-generate-001';
    
    const generate = async (aspectRatio: '1:1' | '9:16' | '16:9', suffix: string) => {
        const fullPrompt = `${prompt}, ${suffix}. Include text '${artistName}' and '${releaseTitle}' where appropriate, artistically integrated.`;
        const response = await ai.models.generateImages({
            model,
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });
        trackUsage({ model, type: 'image', count: 1, description: `Social Media Kit: ${suffix}` });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    };

    const [
        profilePicture,
        postImage,
        storyImage,
        headerImage,
        thumbnailImage,
    ] = await Promise.all([
        generate('1:1', "simple, clean, bold, suitable for a small profile picture"),
        generate('1:1', "eye-catching, suitable for a social media post"),
        generate('9:16', "vertical format, suitable for a story background"),
        generate('16:9', "wide panoramic banner, suitable for a social media header"),
        generate('16:9', "vibrant, high-contrast, suitable for a video thumbnail"),
    ]);

    return { profilePicture, postImage, storyImage, headerImage, thumbnailImage };
};

const soundPackItemSchema = {
    type: Type.OBJECT,
    properties: {
        genre: { type: Type.STRING, description: "The target genre for this version." },
        newLyrics: { type: Type.STRING, description: "Completely new lyrics inspired by the original, but tailored to the new genre. Formatted with sections like [Verse 1], [Chorus]." },
        styleGuide: { type: Type.STRING, description: "A detailed guide for music production in the new genre, including mood, instrumentation, vocal style, and tempo." },
        creativeConcept: { type: Type.STRING, description: "A one-sentence creative concept that guided this specific genre remix."},
        albumCoverPrompt: { type: Type.STRING, description: "A detailed, artistic prompt for an image generation model to create a compelling album cover for this specific genre remix. The prompt should reflect the new creative concept, genre, and mood." }
    },
    required: ["genre", "newLyrics", "styleGuide", "creativeConcept", "albumCoverPrompt"]
};

export type ArtistPackType = 'Male Vocalist' | 'Female Vocalist' | 'Band' | 'Duet';

export const generateSoundPack = async (
    originalLyrics: string,
    originalInspiration: string,
    targetGenres: string[],
    artistPackType: ArtistPackType
): Promise<SoundPackItem[]> => {
    let singerGender: SingerGender;
    let artistType: ArtistType;

    switch(artistPackType) {
        case 'Male Vocalist':
            singerGender = 'male';
            artistType = 'solo';
            break;
        case 'Female Vocalist':
            singerGender = 'female';
            artistType = 'solo';
            break;
        case 'Duet':
            singerGender = 'any';
            artistType = 'duet';
            break;
        case 'Band':
        default:
            singerGender = 'any';
            artistType = 'band';
            break;
    }

    const generationPromises = targetGenres.map(genre => {
        const prompt = `Act as an expert music producer and A&R. Your task is to completely reimagine a song in a new genre.
        
        **Original Inspiration (${originalInspiration}):**
        ---
        ${originalLyrics}
        ---

        **Target Genre:** ${genre}
        **Singer Gender:** ${singerGender}
        **Artist Type:** ${artistType}

        **Instructions:**
        1.  Create a new, one-sentence \`creativeConcept\` for this reimagining.
        2.  Write completely \`newLyrics\` inspired by the original's themes but fitting the new concept and genre.
        3.  Write a detailed \`styleGuide\` for a production in the target genre.
        4.  Generate a detailed, artistic \`albumCoverPrompt\` for an image generation model to create a compelling album cover for this specific genre remix. The prompt should reflect the new creative concept, genre, and mood.
        5.  The output must be a single JSON object matching the schema.`;

        return ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: soundPackItemSchema,
            },
        });
    });

    const responses = await Promise.all(generationPromises);

    const soundPackItems = responses.map((response, index) => {
        const jsonText = response.text.trim();
        const promptLength = (targetGenres[index] || '').length + originalLyrics.length + 200; // Rough estimate
        trackUsage({
            model: 'gemini-2.5-flash',
            type: 'text',
            inputChars: promptLength,
            outputChars: jsonText.length,
            description: `Sound Pack Item: ${targetGenres[index]}`
        });
        return JSON.parse(jsonText) as SoundPackItem;
    });

    return soundPackItems;
};

export const getLyricalSuggestions = async (lyrics: string, prompt: string): Promise<string> => {
    const fullPrompt = `Act as an expert lyrical co-writer and poet. A user is working on the lyrics below and needs help. Your task is to provide creative suggestions based on their request.

    **Current Lyrics:**
    ---
    ${lyrics}
    ---

    **User's Request:** "${prompt}"

    **Instructions:**
    - Provide 3-5 distinct, actionable suggestions.
    - For each suggestion, briefly explain *why* it improves the lyric (e.g., "This enhances the imagery," "This creates a stronger internal rhyme").
    - Format your entire response using Markdown for clear readability.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
    });

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: fullPrompt.length,
        outputChars: response.text.length,
        description: 'Lyrical Co-Writer Suggestion'
    });

    return response.text.trim();
};

const bridgeOptionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "The conceptual approach for this bridge (e.g., 'New Perspective', 'Emotional Climax', 'Musical Shift')." },
            lyrics: { type: Type.STRING, description: "The generated lyrics for the bridge, formatted with line breaks." },
            explanation: { type: Type.STRING, description: "A brief music theory or songwriting explanation for why this bridge works." }
        },
        required: ["type", "lyrics", "explanation"]
    }
};

export const generateBridges = async (verse: string, chorus: string): Promise<BridgeOption[]> => {
    const prompt = `Act as an expert songwriter and music theorist. I need a bridge for my song. Generate exactly three distinct bridge options based on the provided verse and chorus lyrics.

    **Verse Lyrics:**
    ---
    ${verse}
    ---

    **Chorus Lyrics:**
    ---
    ${chorus}
    ---

    **Instructions:**
    Generate an array of three JSON objects. Each object must contain:
    1.  \`type\`: The conceptual approach. The three types must be: 'New Perspective', 'Emotional Climax', and 'Musical Shift'.
    2.  \`lyrics\`: The generated bridge lyrics that fit the song's theme.
    3.  \`explanation\`: A brief (1-2 sentences) explanation of the songwriting technique used.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: bridgeOptionsSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: prompt.length, outputChars: jsonText.length, description: 'Generate Bridges' });
    return JSON.parse(jsonText) as BridgeOption[];
};

const mixdownReportSchema = {
    type: Type.OBJECT,
    properties: {
        frequencyBalance: {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Feedback on the overall frequency balance (lows, mids, highs)." },
                suggestion: { type: Type.STRING, description: "An actionable suggestion to improve the frequency balance." }
            },
            required: ["feedback", "suggestion"]
        },
        dynamics: {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Feedback on the dynamic range and compression." },
                suggestion: { type: Type.STRING, description: "An actionable suggestion to improve dynamics." }
            },
            required: ["feedback", "suggestion"]
        },
        stereoImage: {
            type: Type.OBJECT,
            properties: {
                feedback: { type: Type.STRING, description: "Feedback on the stereo width and panning." },
                suggestion: { type: Type.STRING, description: "An actionable suggestion to improve the stereo image." }
            },
            required: ["feedback", "suggestion"]
        },
        overallSummary: {
            type: Type.STRING,
            description: "A brief, encouraging summary of the mix's strengths and key area for improvement."
        }
    },
    required: ["frequencyBalance", "dynamics", "stereoImage", "overallSummary"]
};

export const analyzeMixdown = async (audioBlob: Blob): Promise<MixdownReport> => {
    const base64Audio = await blobToBase64(audioBlob);

    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio,
        },
    };

    const textPart = {
        text: `You are an expert audio mastering engineer. Analyze the provided audio mix. Provide constructive, professional feedback in the specified JSON format. Your analysis should cover three key areas:
1.  **Frequency Balance:** Comment on the relationship between bass, mids, and treble. Is anything masking something else? Is it muddy or too harsh?
2.  **Dynamics:** Comment on the overall dynamic range. Does it sound punchy, or is it over-compressed? Is there a good contrast between loud and soft sections?
3.  **Stereo Image:** Comment on the width and depth of the mix. Is it engaging? Is the panning effective?
Provide an overall summary at the end. Be encouraging but honest.`
    };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: mixdownReportSchema,
        },
    });

    const jsonText = response.text.trim();
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'multimodal',
        inputChars: textPart.text.length,
        outputChars: jsonText.length,
        description: `Analyze Mixdown: ${(audioBlob as any).name || 'audio blob'}`
    });
    return JSON.parse(jsonText) as MixdownReport;
};

export const generateMerchMockups = async (artistName: string, visualPrompt: string): Promise<MerchKit> => {
    const model = 'imagen-4.0-generate-001';

    const generate = async (prompt: string) => {
        const response = await ai.models.generateImages({
            model,
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });
        trackUsage({ model, type: 'image', count: 1, description: `Merch Mockup: ${prompt.substring(0, 30)}` });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    };

    const [tshirt, hoodie, poster, hat] = await Promise.all([
        generate(`Product mockup photo of a black t-shirt featuring the name '${artistName}' and a design inspired by: '${visualPrompt}'. Centered graphic, clean studio background.`),
        generate(`Product mockup photo of a grey hoodie featuring the name '${artistName}' and a design inspired by: '${visualPrompt}'. Centered graphic on the front, clean studio background.`),
        generate(`A high-resolution poster design for the musical artist '${artistName}' based on the theme: '${visualPrompt}'. Include the artist's name prominently.`),
        generate(`Product mockup photo of a black baseball cap with an embroidered logo on the front. The logo should feature the name '${artistName}' and be inspired by the theme: '${visualPrompt}'.`)
    ]);

    return { tshirt, hoodie, poster, hat };
};

export const generatePlaylistPitch = async (songTitle: string, artistName: string, genre: string, vibe: string, sellingPoints: string): Promise<string> => {
    const prompt = `Act as an expert music publicist writing a pitch for a playlist curator. The tone must be professional, concise, and compelling. Do not be overly familiar or use slang.

    **Artist:** ${artistName}
    **Song:** ${songTitle}
    **Genre:** ${genre}
    **Vibe/Mood:** ${vibe}
    **Key Selling Points/Hooks:** ${sellingPoints || 'Not provided.'}

    Based on this, write an email pitch. The entire output should be plain text.
    1.  Start with a compelling subject line.
    2.  The body should briefly introduce the song, explain why it's a good fit for a playlist (mentioning genre and mood), highlight any key selling points, and provide a clear call to action with a placeholder link.
    3.  Keep the total word count under 150 words.

    Example structure to follow:
    Subject: [Your Subject]

    Hi Curator,

    [Body of email]

    Thanks for your consideration.

    Best,
    ${artistName}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: response.text.length,
        description: `Playlist Pitch for: ${songTitle}`
    });

    return response.text.trim();
};

export const generateSpeechFromText = async (text: string, voiceName: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    trackUsage({
        model: 'gemini-2.5-flash-preview-tts',
        // FIX: Changed usage type to 'text' to correctly track cost by input characters for TTS.
        type: 'text',
        inputChars: text.length,
        description: `Vocal Synthesis with voice: ${voiceName}`
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("AI did not return any audio data.");
    }
    return base64Audio;
};

export const generateVideoFromLyrics = async (lyrics: string, onProgress: (message: string) => void): Promise<string> => {
    try {
        onProgress('Analyzing lyrics to create a detailed video prompt...');
        
        const promptGenPrompt = `Based on the following lyrics, create a detailed, visually descriptive prompt for a video generation AI like Veo or Sora. The prompt should be a few sentences long, capturing the main visual elements, style, mood, color palette, camera movements, and overall cinematic feel of a music video for these lyrics. Do not just summarize the lyrics; create a compelling cinematic vision.

Lyrics:
---
${lyrics}
---

Example of a good prompt: "An epic, cinematic shot of a lone astronaut drifting through a neon-lit asteroid field. Ghosts of their past flash before their eyes as lens flares streak across the screen. The mood is melancholic and introspective, with a color palette of deep blues, purples, and vibrant pinks. Slow, floating camera movements."`;
        
        const promptResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptGenPrompt,
        });

        const videoPrompt = promptResponse.text.trim();
        trackUsage({ model: 'gemini-2.5-flash', type: 'text', inputChars: promptGenPrompt.length, outputChars: videoPrompt.length, description: 'Lyrics-to-Video-Prompt: Prompt Generation' });
        
        onProgress('Done!');
        return videoPrompt;

    } catch (error: any) {
        console.error("Video prompt generation process failed:", error);
        throw error;
    }
};

export const generateMusicalLayer = async (
    analysis: ArtistStyleProfile,
    partType: 'bassline' | 'melody' | 'chords'
): Promise<MelodyAnalysis> => {
    const partDescription = {
        bassline: 'a groovy and complementary bassline that locks in with the rhythm.',
        melody: 'a catchy and memorable top-line synth melody.',
        chords: 'a lush and atmospheric chord progression using pads or keys.'
    }[partType];

    const prompt = `Act as an expert music producer and composer. I have a track with the following style profile:
    - Genre: ${analysis.genre}
    - Mood: ${analysis.mood}
    - Tempo: ${analysis.tempo}
    - Rhythm: ${analysis.rhythm}
    - Harmony: ${analysis.harmony}
    - Instrumentation: ${analysis.instrumentation}
    
    Your task is to generate ${partDescription}
    The output must be a JSON object containing a list of notes with pitch (e.g., 'C#3'), startTime (in seconds), and duration (in seconds), along with the track's BPM.
    The musical piece should be 8 measures long. Assume a 4/4 time signature.
    The BPM should be derived from the tempo description (e.g., 'Medium (80-120 BPM)' could be 100 BPM).
    Base the harmony of your generated part on the provided style profile.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: melodyAnalysisSchema,
        },
    });
    
    const jsonText = response.text.trim();
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: jsonText.length,
        description: `Co-Producer: Generate ${partType}`
    });
    
    return JSON.parse(jsonText) as MelodyAnalysis;
};


export const generateFeatureGuide = async (toolName: string): Promise<string> => {
    const prompt = `Act as an expert technical writer and product educator for a music creation application called "MustBMusic Song Maker".
Your task is to write a comprehensive and easy-to-understand guide for the "${toolName}" feature.
The guide should be formatted in clean Markdown and follow this exact structure:

# ${toolName}

## 1. What It Is
(Provide a concise, one-paragraph explanation of the tool's main purpose and what it helps the user achieve.)

## 2. How to Use It
(Provide a step-by-step guide on using the feature. Use a numbered list. Be clear and direct.)

## 3. Pro Tips for Best Results
(Offer 3-5 bullet points with expert advice, tips, or creative ideas for getting the most out of the tool.)

## 4. The Tech Behind the Magic
(Briefly explain in simple terms the AI technology that powers this feature. For example, mention if it uses text generation, image generation, audio analysis, etc.)

Keep the tone helpful, encouraging, and professional.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'text',
        inputChars: prompt.length,
        outputChars: response.text.length,
        description: `Feature Guide: ${toolName}`
    });

    return response.text.trim();
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
  // FIX: Changed `len` to `l` to fix reference error.
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

const vocalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        vocalRange: { type: Type.STRING, description: "The singer's estimated vocal range (e.g., 'Baritone', 'Soprano', 'Tenor')." },
        timbre: { type: Type.STRING, description: "A detailed description of the voice's texture and quality (e.g., 'Raspy and warm', 'Bright and airy')." },
        style: { type: Type.STRING, description: "The performance style (e.g., 'Heavy use of vibrato', 'Rhythmic and percussive', 'Smooth and connected legato')." },
        pitch: { type: Type.STRING, description: "An analysis of pitch accuracy and characteristics (e.g., 'Very accurate with occasional sharp notes', 'Stable with controlled vibrato')." },
        summary: { type: Type.STRING, description: "A one or two-sentence summary of the overall vocal character." },
    },
    required: ["vocalRange", "timbre", "style", "pitch", "summary"]
};

const vocalComparisonSchema = {
    type: Type.OBJECT,
    properties: {
        similarityScore: { type: Type.INTEGER, description: "A score from 0 (completely different) to 100 (indistinguishable) representing the vocal similarity." },
        justification: { type: Type.STRING, description: "A detailed explanation for the similarity score, comparing timbre, pitch, vibrato, and style." },
        voice1Analysis: vocalAnalysisSchema,
        voice2Analysis: vocalAnalysisSchema,
    },
    required: ["similarityScore", "justification", "voice1Analysis", "voice2Analysis"]
};


export const analyzeVocalProfile = async (audioBlob: Blob): Promise<VocalAnalysis> => {
    const base64Audio = await blobToBase64(audioBlob);

    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: base64Audio,
        },
    };

    const textPart = {
        text: `You are an expert vocal coach. Analyze the provided audio file which contains a singing voice. Your analysis should be objective and technical. Provide a detailed breakdown of the vocal characteristics in the specified JSON format. The summary should be a high-level overview of the singer's voice.`
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [audioPart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: vocalAnalysisSchema,
        },
    });

    const jsonText = response.text.trim();
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'multimodal',
        inputChars: textPart.text.length,
        outputChars: jsonText.length,
        description: `Vocal Analysis: ${(audioBlob as any).name || 'audio blob'}`
    });
    
    return JSON.parse(jsonText) as VocalAnalysis;
};

export const compareVocalProfiles = async (audioBlob1: Blob, audioBlob2: Blob): Promise<VocalComparison> => {
    const [base64Audio1, base64Audio2] = await Promise.all([
        blobToBase64(audioBlob1),
        blobToBase64(audioBlob2)
    ]);

    const audioPart1 = { inlineData: { mimeType: audioBlob1.type, data: base64Audio1 } };
    const audioPart2 = { inlineData: { mimeType: audioBlob2.type, data: base64Audio2 } };
    
    const textPart = {
        text: `You are an expert musicologist and audio analyst specializing in vocal timbre and performance. Compare the two provided audio files, each containing a singing voice.
1.  Provide a 'similarityScore' from 0 (completely different) to 100 (indistinguishable).
2.  Write a detailed 'justification' explaining your score, comparing aspects like pitch, timbre, vibrato, phrasing, and vocal technique.
3.  For each voice, provide a concise but technical analysis covering vocal range, timbre, style, and pitch characteristics.
The output must be ONLY the JSON object, without any markdown formatting or explanatory text.`
    };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [
            { text: "This is Voice 1:" },
            audioPart1,
            { text: "This is Voice 2:" },
            audioPart2,
            textPart,
        ] },
        config: {
            responseMimeType: "application/json",
            responseSchema: vocalComparisonSchema,
        },
    });

    const jsonText = response.text.trim();
    
    trackUsage({
        model: 'gemini-2.5-flash',
        type: 'multimodal',
        inputChars: textPart.text.length,
        outputChars: jsonText.length,
        description: `Vocal Comparison: ${(audioBlob1 as any).name || 'audio 1'} vs ${(audioBlob2 as any).name || 'audio 2'}`
    });
    
    return JSON.parse(jsonText) as VocalComparison;
};