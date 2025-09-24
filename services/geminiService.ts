import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- TYPE DEFINITIONS ---
export interface Note {
    note: string;
    duration: string;
    time: string;
}

export interface MelodyLine {
    lineIndex: number;
    notes: Note[];
}

export type VocalMelody = MelodyLine[];


const styleGuideExample = `🎼 Style – Only a Fool for Love
Genre: Classic Philly Soul / R&B
Vibe: Evokes the sound of iconic 1970s Philadelphia soul groups, with lush orchestrations and smooth, heartfelt vocal harmonies.
Tempo: Mid-tempo ballad groove (~80 BPM)
Key: C Major
Mood: Bittersweet, heartfelt, romantic with a touch of melancholy
🎤 Vocals:
Lead singer: Smooth, emotive male tenor with occasional falsetto.
🎹 Instrumentation:
Drums: Tight, steady groove, light snare + hi-hat shuffle.
Bass: Melodic, warm bassline driving the song.
Keys: Electric piano (Fender Rhodes).
Strings: Sweeping orchestral lines for drama.`;

export interface GeneratedSongData {
    lyrics: string;
    styleGuide: string;
    title: string;
    artistName: string;
    artistBio: string;
    artistImagePrompt: string;
    beatPattern: string;
    bpm: number;
}

export const generateSong = async (prompt: string, genre: string, artistType: 'Solo Artist' | 'Group' | 'Duet'): Promise<GeneratedSongData> => {
    try {
        const artistTypeLower = artistType.toLowerCase();
        
        let videoPromptExample = "";
        switch (artistType) {
            case 'Solo Artist':
                videoPromptExample = "A soulful 70s R&B singer in a velvet suit, posing on a city street at dusk, cinematic lighting, emotionally singing, 4k, cinematic";
                break;
            case 'Group':
                videoPromptExample = "A soulful 70s R&B group in matching velvet suits, posing on a city street at dusk, cinematic lighting, singing emotionally, 4k, cinematic";
                break;
            case 'Duet':
                videoPromptExample = "A male and female R&B duo in a dramatic studio setting, singing emotionally to each other, cinematic lighting, 4k, cinematic";
                break;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the idea "${prompt}" for a ${genre} song, generate a complete, creative song package for a ${artistTypeLower}.

**EXAMPLE STYLE GUIDE FORMAT:**
---
${styleGuideExample}
---

**INSTRUCTIONS:**
Create a single JSON object containing:
1.  **title:** A creative title for the song.
2.  **artistName:** Invent a plausible name for the ${artistTypeLower}.
3.  **artistBio:** A short, fictional biography (2-3 sentences) for the invented ${artistTypeLower}.
4.  **artistImagePrompt:** A descriptive prompt for an AI video generator to create a short, looping music video clip for the ${artistTypeLower} (e.g., "${videoPromptExample}").
5.  **lyrics:** Write compelling lyrics following a standard song structure. The lyrics must be a single string with each line separated by a newline character ('\\n'). Explicitly include song structure markers like '[Verse]', '[Chorus]', and '[Bridge]' on their own lines. If the artistType is 'Duet', the lyrics MUST be formatted for two singers (a male and a female). Clearly indicate who is singing by starting the line with '(Singer 1)', '(Singer 2)', or '(Both)'.
6.  **styleGuide:** Create a detailed production style guide for the song, using the provided example as a template for formatting and detail. IMPORTANT: Do not use real artist names. Instead, describe the style or vibe they are known for (e.g., "in the style of a classic 70s soul group" instead of "like The Spinners").
7.  **beatPattern:** Based on the generated style guide (especially tempo and feel), create a 16-step drum machine pattern. Represent it as a JSON string with keys for "kick", "snare", and "hihat", and optionally "clap". Each key should have an array of numbers from 0 to 15 indicating the steps where the sound is triggered. Example: '{"kick": [0, 8], "snare": [4, 12], "hihat": [0,2,4,6,8,10,12,14], "clap": [4]}'.
8.  **bpm:** Extract the tempo (Beats Per Minute) from the style guide and provide it as a single integer (e.g., 80).`,
            config: {
                systemInstruction: "You are a world-class songwriter and music producer. Your task is to generate a strong, editable first draft of a complete song package. This includes a song title, artist name/bio, artist video prompt, creative lyrics, a style guide, a drum pattern, and a BPM. The entire output must be a single, valid JSON object.",
                temperature: 0.8,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        artistName: { type: Type.STRING },
                        artistBio: { type: Type.STRING },
                        artistImagePrompt: { type: Type.STRING },
                        lyrics: { type: Type.STRING },
                        styleGuide: { type: Type.STRING },
                        beatPattern: { type: Type.STRING },
                        bpm: { type: Type.NUMBER, description: "Beats Per Minute for the song." }
                    },
                    required: ["title", "artistName", "artistBio", "artistImagePrompt", "lyrics", "styleGuide", "beatPattern", "bpm"]
                }
            },
        });
        
        const jsonString = response.text.trim();
        const responseObject = JSON.parse(jsonString);
        
        return {
            lyrics: responseObject.lyrics || '',
            styleGuide: responseObject.styleGuide || '',
            title: responseObject.title || 'Untitled',
            artistName: responseObject.artistName || 'Anonymous',
            artistBio: responseObject.artistBio || '',
            artistImagePrompt: responseObject.artistImagePrompt || '',
            beatPattern: responseObject.beatPattern || '{"kick":[],"snare":[],"hihat":[]}',
            bpm: responseObject.bpm || 120
        };

    } catch (error) {
        console.error("Error generating content with Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const generateStorylines = async (topic: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 5 unique and compelling song storylines based on the topic: "${topic}". Each storyline should be a short paragraph, suitable as a creative starting point for a song.`,
            config: {
                systemInstruction: "You are a creative assistant for songwriters. Your task is to provide 5 distinct song ideas as a JSON object with a single key 'storylines' which is an array of strings.",
                temperature: 0.9,
                topP: 1.0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        storylines: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of 5 song storyline ideas."
                        }
                    },
                    required: ["storylines"]
                }
            },
        });
        
        const jsonString = response.text.trim();
        const responseObject = JSON.parse(jsonString);
        
        return responseObject.storylines || [];

    } catch (error) {
        console.error("Error generating storylines with Gemini API:", error);
        throw new Error("Failed to generate song storylines.");
    }
};

export const remixBeat = async (styleGuide: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following music style guide, generate a new 16-step drum machine pattern.

**Style Guide:**
---
${styleGuide}
---

**INSTRUCTIONS:**
Output ONLY a single valid JSON object representing the drum pattern. The JSON must have keys "kick", "snare", and "hihat". It can also optionally include "clap". Each key should have an array of numbers from 0 to 15 indicating the steps where the sound is triggered. Do not include any other text or markdown formatting.`,
            config: {
                systemInstruction: "You are a creative drum machine programmer. Your only job is to create a compelling 16-step drum pattern based on a musical style guide and output it as a clean JSON object.",
                temperature: 0.9,
                topP: 1.0,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        kick: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                        snare: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                        hihat: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                        clap: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Optional clap pattern." },
                    },
                    required: ["kick", "snare", "hihat"]
                }
            },
        });
        
        return response.text.trim();

    } catch (error) {
        console.error("Error remixing beat with Gemini API:", error);
        throw new Error("Failed to remix the beat.");
    }
};

export const generateVocalMelody = async (lyrics: string, styleGuide: string): Promise<VocalMelody> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are a music composer. Your task is to create a simple, singable vocal melody for the provided lyrics, based on the given style guide.

**Style Guide:**
---
${styleGuide}
---

**Lyrics:**
---
${lyrics}
---

**INSTRUCTIONS:**
Analyze the lyrics and style guide (especially tempo, key, and mood). Generate a JSON array representing the vocal melody.
- The root of the JSON should be an array.
- Each element in the array represents a *speakable line of lyrics* and must be an object with two keys: "lineIndex" and "notes".
- "lineIndex" is the original 0-based index of the line in the full lyrics text.
- "notes" is an array of note objects.
- Each note object must have "note" (e.g., "C4"), "duration" (e.g., "8n", "4n"), and "time" in Tone.js Transport format ('bar:quarter:sixteenth').
- The melody should be simple, diatonic (within the specified key), and follow the natural rhythm of the lyrics.
- Ensure the "time" values are sequential and make musical sense. A 2-bar loop is a good structure for verses and choruses.
- Omit lines that are empty or only contain section markers like '[Verse]'.

**EXAMPLE OUTPUT:**
[
  {
    "lineIndex": 1,
    "notes": [
      { "note": "C4", "duration": "8n", "time": "0:0:0" },
      { "note": "D4", "duration": "8n", "time": "0:0:2" },
      { "note": "E4", "duration": "4n", "time": "0:1:0" }
    ]
  },
  {
    "lineIndex": 2,
    "notes": [
      { "note": "G4", "duration": "4n", "time": "0:2:0" },
      { "note": "E4", "duration": "4n", "time": "0:3:0" }
    ]
  }
]
`,
            config: {
                systemInstruction: "You are an expert music composer AI. You create simple, pleasant, and musically correct vocal melodies based on lyrics and a style guide. Your output must be a perfectly-formatted JSON array adhering to the specified schema.",
                temperature: 0.7,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            lineIndex: { type: Type.INTEGER },
                            notes: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        note: { type: Type.STRING },
                                        duration: { type: Type.STRING },
                                        time: { type: Type.STRING },
                                    },
                                    required: ["note", "duration", "time"]
                                }
                            }
                        },
                        required: ["lineIndex", "notes"]
                    }
                }
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as VocalMelody;

    } catch (error) {
        console.error("Error generating vocal melody with Gemini API:", error);
        throw new Error("Failed to compose the vocal melody.");
    }
};


export const generateArtistVideo = async (prompt: string): Promise<string> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: `${prompt}, looping video`,
            config: {
                numberOfVideos: 1
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation did not return a valid link.");
        }
        
        const response = await fetch(`${downloadLink}&key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(videoBlob);
        });

    } catch (error) {
        console.error("Error generating video with Gemini API:", error);
        throw new Error("Failed to generate the artist video.");
    }
};