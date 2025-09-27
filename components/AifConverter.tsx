import React, { useState, useCallback } from 'react';
import { PromptForm } from './PromptForm';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadButton } from './DownloadButton';
import { audioBufferToMp3 } from '../services/audioService';

declare var ID3Writer: any;
declare var AV: any; // For aurora.js

export const AifConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mp3BlobUrl, setMp3BlobUrl] = useState<string | null>(null);
  const [mp3FileName, setMp3FileName] = useState<string>('');

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
        const allowedExtensions = ['.aif', '.aiff', '.wav', '.mp3'];
        const fileExtension = `.${selectedFile.name.split('.').pop()?.toLowerCase()}`;

        if (!allowedExtensions.includes(fileExtension)) {
            setError('Please select a valid AIF, WAV, or MP3 audio file.');
            setFile(null);
            setStatus('error');
            return;
        }
        setFile(selectedFile);
        setCoverArt(null);
        setError(null);
        setStatus('idle');
        if (mp3BlobUrl) {
            URL.revokeObjectURL(mp3BlobUrl);
        }
        setMp3BlobUrl(null);
    }
  };
  
  const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
        if (!selectedFile.type.startsWith('image/')) {
            setError('Please select a valid image file (e.g., JPEG, PNG).');
            setCoverArt(null);
            return;
        }
        setCoverArt(selectedFile);
        setError(null);
    }
  };
  
  const decodeWithAurora = (file: File): Promise<AudioBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            if (!e.target?.result) {
                return reject(new Error('FileReader failed to read the file.'));
            }
            
            try {
                const asset = AV.Asset.fromBuffer(e.target.result as ArrayBuffer);

                asset.on('error', (err: any) => {
                    console.error('Aurora.js decoding error:', err);
                    reject(new Error('Failed to decode AIF file with custom decoder.'));
                });

                asset.decodeToBuffer((interleavedPcm: Float32Array) => {
                    if (!interleavedPcm || interleavedPcm.length === 0) {
                        return reject(new Error('AIF decoder produced an empty buffer.'));
                    }

                    const numChannels = asset.format.channelsPerFrame;
                    const sampleRate = asset.format.sampleRate;
                    const frameCount = interleavedPcm.length / numChannels;
                    
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const audioBuffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

                    // De-interleave the PCM data into the AudioBuffer
                    for (let channel = 0; channel < numChannels; channel++) {
                        const channelData = audioBuffer.getChannelData(channel);
                        for (let i = 0; i < frameCount; i++) {
                            channelData[i] = interleavedPcm[i * numChannels + channel];
                        }
                    }
                    resolve(audioBuffer);
                });
            } catch (err) {
                console.error("Error initializing Aurora asset from buffer:", err);
                reject(err);
            }
        };

        reader.onerror = (e) => {
            console.error('FileReader error:', e);
            reject(new Error('Failed to read the AIF file.'));
        };

        reader.readAsArrayBuffer(file);
    });
  };

  const handleConvert = async () => {
    if (!file) {
      setError('Please select a file first.');
      setStatus('error');
      return;
    }

    setStatus('converting');
    setError(null);
    if (mp3BlobUrl) {
        URL.revokeObjectURL(mp3BlobUrl);
    }
    setMp3BlobUrl(null);

    try {
      let finalMp3Blob: Blob;
      let finalFileName: string;

      const isMp3 = file.type.startsWith('audio/mpeg') || file.name.toLowerCase().endsWith('.mp3');

      if (isMp3) {
        // It's an MP3, just add tags if cover art is present.
        finalFileName = file.name;
        if (!coverArt) {
            // If no cover art, we'll just provide a downloadable copy of the original file.
            finalMp3Blob = file;
        } else {
            const mp3Buffer = await file.arrayBuffer();
            const coverArtBuffer = await coverArt.arrayBuffer();
            const writer = new ID3Writer(mp3Buffer);
            writer.setFrame('APIC', {
                type: 3, // Cover (front)
                data: coverArtBuffer,
                description: 'Cover',
            });
            writer.addTag();
            finalMp3Blob = writer.getBlob();
        }
      } else {
        // It's AIF or WAV, so we need to convert it to MP3.
        let audioBuffer: AudioBuffer;
        const isAif = file.name.toLowerCase().endsWith('.aif') || file.name.toLowerCase().endsWith('.aiff') || file.type.startsWith('audio/aiff');
        
        if (isAif) {
            audioBuffer = await decodeWithAurora(file);
        } else {
            // Use native Web Audio API for WAV and others
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const arrayBuffer = await file.arrayBuffer();
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }
        
        const mp3Blob = audioBufferToMp3(audioBuffer);
        
        const originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
        finalFileName = `${originalFileName}.mp3`;
        
        if (!coverArt) {
            finalMp3Blob = mp3Blob;
        } else {
            const mp3Buffer = await mp3Blob.arrayBuffer();
            const coverArtBuffer = await coverArt.arrayBuffer();
            const writer = new ID3Writer(mp3Buffer);
            writer.setFrame('APIC', {
                type: 3, // Cover (front)
                data: coverArtBuffer,
                description: 'Cover',
            });
            writer.addTag();
            finalMp3Blob = writer.getBlob();
        }
      }
      
      const url = URL.createObjectURL(finalMp3Blob);
      setMp3BlobUrl(url);
      setMp3FileName(finalFileName);
      setStatus('success');

    } catch (err) {
      console.error('Processing failed:', err);
      setError('Failed to process file. The format may not be supported or the file may be corrupt.');
      setStatus('error');
    }
  };

  const handleReset = useCallback(() => {
    setStatus('idle');
    setFile(null);
    setCoverArt(null);
    setError(null);
    if (mp3BlobUrl) {
      URL.revokeObjectURL(mp3BlobUrl);
    }
    setMp3BlobUrl(null);
    setMp3FileName('');
  }, [mp3BlobUrl]);
  
  const ConversionSuccess: React.FC = () => (
    <div className="text-center p-8 bg-gray-800/50 rounded-xl animate-fade-in border border-gray-700">
      <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-green-900/50 border border-green-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-green-400">Processing Complete!</h2>
      <p className="mt-2 text-gray-300 max-w-md mx-auto">Your audio file is ready for download.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        {mp3BlobUrl && <DownloadButton blobUrl={mp3BlobUrl} fileName={mp3FileName} />}
        <button
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300"
            aria-label="Process another file"
          >
            Process Another File
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (status) {
      case 'converting':
        return (
          <div className="text-center p-10 bg-gray-800/50 rounded-xl">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-400 text-lg animate-pulse">
              Processing Audio...
            </p>
            <p className="text-gray-500">
              This may take a moment. Please wait...
            </p>
          </div>
        );
      case 'success':
        return <ConversionSuccess />;
      case 'error':
      case 'idle':
      default:
        return (
          <div>
            <PromptForm
              onFileSelect={handleFileSelect}
              onConvert={handleConvert}
              file={file}
              isLoading={status === 'converting'}
              accept=".aif,.aiff,.wav,.mp3,audio/aiff,audio/wav,audio/mpeg"
              promptText="Drag & Drop Audio File (AIF, WAV, MP3)"
              buttonText="Process Audio File"
            />
            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <label htmlFor="cover-art-input" className="block text-lg font-medium text-gray-300 mb-2">
                    Add Album Art (Optional)
                </label>
                <div className="flex items-center gap-4">
                    <input
                        id="cover-art-input"
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleCoverArtSelect}
                        className="hidden"
                        disabled={status === 'converting'}
                    />
                    <button
                        type="button"
                        onClick={() => document.getElementById('cover-art-input')?.click()}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                        disabled={status === 'converting' || !file}
                        aria-label="Choose image file for album art"
                    >
                        Choose Image...
                    </button>
                    {coverArt && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-teal-400 truncate" title={coverArt.name}>{coverArt.name}</span>
                        </div>
                    )}
                </div>
            </div>
          </div>
        );
    }
  }

  return (
    <div>
        {error && <ErrorMessage message={error} />}
        {renderContent()}
    </div>
  );
};