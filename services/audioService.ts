
// Declaration for lamejs from CDN
declare var lamejs: any;


/**
 * Encodes an AudioBuffer into an MP3 file format Blob using lamejs.
 * @param buffer The Web Audio API AudioBuffer to encode.
 * @returns A Blob representing the MP3 file.
 */
export const audioBufferToMp3 = (buffer: AudioBuffer): Blob => {
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

    for (let i = 0; i < pcmLeft.length; i += sampleBlockSize) {
        const leftChunk = pcmLeft.subarray(i, i + sampleBlockSize);
        const rightChunk = pcmRight.subarray(i, i + sampleBlockSize);
        
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
};
