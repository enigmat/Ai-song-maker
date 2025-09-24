import type { VocalMelody } from './geminiService';

// Declaration for Tone.js from CDN
declare const Tone: any;

/**
 * Encodes an AudioBuffer into a WAV file format Blob. This function constructs a
 * valid WAV header and then interleaves the channel data into a 16-bit PCM format.
 * @param buffer The Web Audio API AudioBuffer to encode.
 * @returns A Blob representing the WAV file, compatible with standard audio software.
 */
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const dataSize = numFrames * numChannels * bytesPerSample;
    const fileSize = 44 + dataSize; // 44 bytes for WAV header

    const arrayBuffer = new ArrayBuffer(fileSize);
    const view = new DataView(arrayBuffer);

    let offset = 0;

    // Helper to write a string to the DataView
    const writeString = (str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
        offset += str.length;
    };
    
    // RIFF chunk descriptor
    writeString('RIFF');
    view.setUint32(offset, fileSize - 8, true); offset += 4; // fileSize - 8 bytes
    writeString('WAVE');

    // "fmt " sub-chunk
    writeString('fmt ');
    view.setUint32(offset, 16, true); offset += 4; // 16 for PCM
    view.setUint16(offset, 1, true); offset += 2;  // PCM is format 1
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numChannels * bytesPerSample, true); offset += 4; // byteRate
    view.setUint16(offset, numChannels * bytesPerSample, true); offset += 2; // blockAlign
    view.setUint16(offset, bitsPerSample, true); offset += 2;

    // "data" sub-chunk
    writeString('data');
    view.setUint32(offset, dataSize, true); offset += 4;

    // Write the PCM data by interleaving channels
    const channels = [];
    for (let i = 0; i < numChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    for (let frame = 0; frame < numFrames; frame++) {
        for (let channel = 0; channel < numChannels; channel++) {
            // Get sample, clamp to [-1, 1]
            const sample = Math.max(-1, Math.min(1, channels[channel][frame]));
            // Convert float to 16-bit signed integer
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, intSample, true);
            offset += bytesPerSample;
        }
    }

    return new Blob([view], { type: 'audio/wav' });
};


/**
 * Renders a specific set of tracks to an AudioBuffer using Tone.Offline.
 */
const renderAudio = async (
    songData: { beatPattern: string, bpm: number, vocalMelody: VocalMelody | null },
    tracksToRender: string[],
    duration: number
): Promise<AudioBuffer> => {

    return await Tone.Offline(async (Transport: any) => {
        Transport.bpm.value = songData.bpm;

        // Setup vocal synth if needed
        if (tracksToRender.includes('vocal') && songData.vocalMelody) {
            const vocalSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "fatsawtooth" },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
            }).toDestination();

            const melodyEvents = songData.vocalMelody.flatMap(line => 
                line.notes.map(note => ({ ...note, lineIndex: line.lineIndex }))
            );

            new Tone.Part((time: any, value: any) => {
                vocalSynth.triggerAttackRelease(value.note, value.duration, time);
            }, melodyEvents).start(0);
        }
        
        // Setup drum synths if needed
        const drumTracks = tracksToRender.filter(t => t !== 'vocal');
        if (drumTracks.length > 0) {
            const drumSynths: { [key: string]: any } = {
                kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 10, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4, attackCurve: "exponential" } }),
                snare: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.005, decay: 0.2, sustain: 0 } }),
                hihat: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }),
                clap: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 } }),
            };

            drumTracks.forEach(track => {
                if (drumSynths[track]) {
                    drumSynths[track].toDestination();
                }
            });

            try {
                const beat = JSON.parse(songData.beatPattern);
                const steps = Array.from({ length: 16 }, (_, i) => i);
                new Tone.Sequence((time: any, step: number) => {
                    if (tracksToRender.includes('kick') && beat.kick?.includes(step)) drumSynths.kick.triggerAttackRelease("C1", "8n", time);
                    if (tracksToRender.includes('snare') && beat.snare?.includes(step)) drumSynths.snare.triggerAttackRelease("16n", time);
                    if (tracksToRender.includes('clap') && beat.clap?.includes(step)) drumSynths.clap.triggerAttackRelease("16n", time);
                    if (tracksToRender.includes('hihat') && beat.hihat?.includes(step)) drumSynths.hihat.triggerAttackRelease("16n", time);
                }, steps, "16n").start(0);
            } catch (e) {
                console.error("Could not parse beat for offline render", e);
            }
        }

        Transport.start();
    }, duration);
};


interface SongDataForRender {
    beatPattern: string;
    bpm: number;
    vocalMelody: VocalMelody | null;
}

interface StemsToRender {
    [key: string]: boolean;
}

/**
 * Renders multiple selected audio stems into WAV file blobs.
 * @param songData The song data containing melody and beat info.
 * @param stemsToRender An object indicating which stems to render.
 * @returns A promise that resolves to an object mapping filenames to blobs.
 */
export const renderStems = async (
    songData: SongDataForRender,
    stemsToRender: StemsToRender
): Promise<{ [filename: string]: Blob }> => {

    const renderedBlobs: { [filename: string]: Blob } = {};
    const trackConfigs: { [key: string]: { tracks: string[], filename: string } } = {
        fullMix: { tracks: ['vocal', 'kick', 'snare', 'hihat', 'clap'], filename: 'full_mix.wav' },
        vocals: { tracks: ['vocal'], filename: 'vocals.wav' },
        drums: { tracks: ['kick', 'snare', 'hihat', 'clap'], filename: 'drums_combined.wav' },
        kick: { tracks: ['kick'], filename: 'kick.wav' },
        snare: { tracks: ['snare'], filename: 'snare.wav' },
        hihat: { tracks: ['hihat'], filename: 'hihat.wav' },
        clap: { tracks: ['clap'], filename: 'clap.wav' },
    };

    let duration = 0;
    if (songData.vocalMelody && songData.vocalMelody.length > 0) {
         const melodyEvents = songData.vocalMelody.flatMap(line => line.notes);
         if (melodyEvents.length > 0) {
             const lastEventTime = Math.max(...melodyEvents.map(e => {
                 const startTime = Tone.Time(e.time).toSeconds();
                 const noteDuration = Tone.Time(e.duration).toSeconds();
                 return startTime + noteDuration;
             }));
             duration = lastEventTime + 2;
         }
    }
    
    if (duration <= 2) {
        const secondsPerBeat = 60.0 / songData.bpm;
        const secondsPerBar = secondsPerBeat * 4;
        duration = secondsPerBar * 8; // Default to 8 bars if no melody
    }
    
    duration = Math.max(5, Math.min(300, duration)); // Clamp duration between 5s and 5min

    const renderingPromises: Promise<void>[] = [];

    for (const stemKey in stemsToRender) {
        if (stemsToRender[stemKey] && trackConfigs[stemKey]) {
            const config = trackConfigs[stemKey];
            const promise = renderAudio(songData, config.tracks, duration)
                .then(audioBuffer => {
                    const wavBlob = audioBufferToWav(audioBuffer);
                    renderedBlobs[config.filename] = wavBlob;
                })
                .catch(err => console.error(`Failed to render stem: ${config.filename}`, err));
            renderingPromises.push(promise);
        }
    }

    await Promise.all(renderingPromises);
    return renderedBlobs;
};