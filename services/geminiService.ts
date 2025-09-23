import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const styleGuideExample = `🎼 Style – Only a Fool for Love
Genre: Classic Philly Soul / R&B (1970s Spinners, O’Jays, Harold Melvin vibes)
Tempo: Mid-tempo ballad groove (~78–84 BPM)
Key: Major with minor chord changes for emotion (like C major with passing A minor / D minor)
Mood: Bittersweet, heartfelt, romantic with a touch of melancholy
🎤 Vocals:
Lead singer: Smooth, emotive male tenor/baritone with occasional falsetto.
Backing harmonies: Rich 3–4 part male group harmonies (like The Spinners), especially in choruses.
Call-and-response: Backgrounds echo the lead on key phrases (“Only a fool…”).
Spoken bridge: Soulful spoken interlude over instrumental build.
🎹 Instrumentation:
Drums: Tight, steady groove, light snare + hi-hat shuffle.
Bass: Melodic, warm bassline driving the song (classic Motown/Philly feel).
Guitars: Clean rhythm guitar with light reverb, occasional wah-wah accents.
Keys: Electric piano (Fender Rhodes) + soft organ pads for warmth.
Strings: Sweeping orchestral lines for drama (layered violins + cellos).
Horns: Brass stabs + fills (trumpet, trombone, sax) punctuating the groove.
Percussion: Tambourine + congas for subtle texture.
🛗 Production Feel:
Lush orchestration, polished mix (think MFSB / Gamble & Huff at Philadelphia International Records).
Wide stereo spread: strings + horns arranged for cinematic depth.
Vocals slightly up-front with warm plate reverb for “classic soul” shine.
✨ The goal: make it sound like it could sit right between The Spinners’ “It Takes a Fool” and The O’Jays’ “Cry Together” — big, emotional, harmony-driven Philly soul.`;

export interface SongData {
    lyrics: string;
    styleGuide: string;
    title: string;
    artistName: string;
    artistBio: string;
    artistImagePrompt: string;
}

export const generateSong = async (prompt: string, genre: string, artistType: 'Solo Artist' | 'Group'): Promise<SongData> => {
    try {
        const artistTypeLower = artistType.toLowerCase();
        const imagePromptExample = artistType === 'Solo Artist'
            ? "A soulful 70s R&B singer in a velvet suit, posing on a city street at dusk, cinematic lighting"
            : "A soulful 70s R&B group in matching velvet suits, posing on a city street at dusk, cinematic lighting";

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
4.  **artistImagePrompt:** A descriptive prompt for an AI image generator to create a press photo for the ${artistTypeLower} (e.g., "${imagePromptExample}").
5.  **lyrics:** Write compelling lyrics following a standard song structure. The lyrics must be a single string with each line separated by a newline character ('\\n'). Explicitly include song structure markers like '[Verse]', '[Chorus]', and '[Bridge]' on their own lines.
6.  **styleGuide:** Create a detailed production style guide for the song, using the provided example as a template for formatting and detail.`,
            config: {
                systemInstruction: "You are a world-class songwriter and music producer, acting as a creative partner. Your task is to generate a strong, editable first draft of a complete song package based on a user's idea. This includes a song title, an invented artist name and bio, a descriptive artist image prompt, creative lyrics, and a detailed production style guide. The entire output must be a single, valid JSON object.",
                temperature: 0.8,
                topP: 0.95,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "A creative title for the song."
                        },
                        artistName: {
                            type: Type.STRING,
                            description: "An invented name for the artist or group."
                        },
                        artistBio: {
                            type: Type.STRING,
                            description: "A short, fictional biography for the artist."
                        },
                        artistImagePrompt: {
                            type: Type.STRING,
                            description: "A descriptive prompt for generating an artist/group press photo."
                        },
                        lyrics: {
                            type: Type.STRING,
                            description: "The generated song lyrics, including structure markers like '[Verse]', with each line separated by a newline character."
                        },
                        styleGuide: {
                            type: Type.STRING,
                            description: "A detailed production style guide for the song, formatted like the provided example."
                        }
                    },
                    required: ["title", "artistName", "artistBio", "artistImagePrompt", "lyrics", "styleGuide"]
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
            artistImagePrompt: responseObject.artistImagePrompt || ''
        };

    } catch (error) {
        console.error("Error generating content with Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};

export const generateArtistImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated by the model.");
        }
    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        throw new Error("Failed to generate the artist image.");
    }
};
