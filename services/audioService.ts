import type { MelodyNote } from './geminiService';

// Declaration for lamejs and MidiWriterJS from CDN
declare var lamejs: any;
declare var MidiWriter: any;


/**
 * Encodes an AudioBuffer into an MP3 file format Blob using lamejs.
 * @param buffer The Web Audio API AudioBuffer to encode.
 * @param onProgress An optional callback to report encoding progress (0-100).
 * @returns A Blob representing the MP3 file.
 */
export const audioBufferToMp3 = (buffer: AudioBuffer, onProgress?: (progress: number) => void): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const kbps = 128; // Bitrate
    const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);

    const samplesLeft = buffer.getChannelData(0);
    // For mono, use the same channel for left and right
    const samplesRight = numChannels > 1 ? buffer.getChannelData(1) : samplesLeft;

    const sampleBlockSize = 1152; // lamejs processing block size
    const mp3Data = [];

    // Helper to convert float32 to int16
    const floatTo16BitPCM = (input: Float32Array): Int16Array => {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    };

    const pcmLeft = floatTo16BitPCM(samplesLeft);
    const pcmRight = floatTo16BitPCM(samplesRight);
    const totalSamples = pcmLeft.length;

    for (let i = 0; i < totalSamples; i += sampleBlockSize) {
        const leftChunk = pcmLeft.subarray(i, i + sampleBlockSize);
        const rightChunk = pcmRight.subarray(i, i + sampleBlockSize);
        
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        if (onProgress) {
            onProgress((i / totalSamples) * 100);
        }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }
    
    if (onProgress) {
        onProgress(100);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
};

export const melodyToMidiBlob = (melody: MelodyNote[], bpm: number): Blob => {
    const track = new MidiWriter.Track();
    track.setTempo(bpm);

    melody.forEach(note => {
        // Tick = startTime * bpm / 60 * 128 (ticks per quarter note in MidiWriterJS)
        const startTick = note.startTime * (bpm / 60) * 128;
        const durationTicks = note.duration * (bpm / 60) * 128;

        track.addEvent(new MidiWriter.NoteEvent({
            pitch: [note.pitch],
            startTick: Math.round(startTick),
            duration: `T${Math.round(durationTicks)}`,
        }));
    });

    const write = new MidiWriter.Writer([track]);
    const base64Midi = write.base64();
    const byteCharacters = atob(base64Midi);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/midi' });
};

export const melodyToMp3 = async (melody: MelodyNote[], instrument: string, bpm: number): Promise<Blob> => {
    // This function must run in an environment with Tone.js
    const Tone = (window as any).Tone;
    if (!Tone) {
        throw new Error("Tone.js is not available.");
    }
    
    let synthConfig;
    switch (instrument) {
        case 'Synth Lead':
            synthConfig = { oscillator: { type: 'fatsawtooth' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.5 } };
            break;
        case 'Bass':
             synthConfig = { oscillator: { type: 'square' }, envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.8 }, filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0, baseFrequency: 200, octaves: 2.6 } };
            break;
        case 'Strings':
            synthConfig = { oscillator: { type: 'triangle8' }, envelope: { attack: 0.4, decay: 0.1, sustain: 0.4, release: 1 } };
            break;
        case 'Piano':
        default:
             synthConfig = { oscillator: { type: "triangle" }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 }, volume: -10 };
            break;
    }

    const totalDuration = melody.reduce((max, note) => Math.max(max, note.startTime + note.duration), 0) + 2; // Add 2s padding

    const buffer = await Tone.Offline(async () => {
        const offlineSynth = instrument === 'Bass' 
            ? new Tone.MonoSynth(synthConfig).toDestination()
            : new Tone.PolySynth(Tone.Synth, synthConfig).toDestination();
        
        const part = new Tone.Part(((time, value) => {
            offlineSynth.triggerAttackRelease(value.note, value.duration, time);
        }), melody.map(note => ({ time: note.startTime, note: note.pitch, duration: note.duration }))).start(0);

        Tone.Transport.bpm.value = bpm;
    }, totalDuration);

    return audioBufferToMp3(buffer.get());
};
