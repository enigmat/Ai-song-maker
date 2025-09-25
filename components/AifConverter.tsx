import React, { useState, useCallback } from 'react';
import { PromptForm } from './PromptForm';
import { ErrorMessage } from './ErrorMessage';
import { LoadingSpinner } from './LoadingSpinner';
import { DownloadButton } from './DownloadButton';
import { audioBufferToMp3 } from '../services/audioService';

export const AifConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mp3BlobUrl, setMp3BlobUrl] = useState<string | null>(null);
  const [mp3FileName, setMp3FileName] = useState<string>('');

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
        // AIFF files often don't have a standard MIME type, so we check by extension.
        if (!selectedFile.name.toLowerCase().endsWith('.aif') && !selectedFile.name.toLowerCase().endsWith('.aiff')) {
            setError('Please select a valid AIF or AIFF audio file.');
            setFile(null);
            setStatus('error');
            return;
        }
        setFile(selectedFile);
        setError(null);
        setStatus('idle');
        if (mp3BlobUrl) {
            URL.revokeObjectURL(mp3BlobUrl);
        }
        setMp3BlobUrl(null);
    }
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
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const mp3Blob = audioBufferToMp3(audioBuffer);
      const url = URL.createObjectURL(mp3Blob);
      setMp3BlobUrl(url);
      
      const originalFileName = file.name.substring(0, file.name.lastIndexOf('.'));
      setMp3FileName(`${originalFileName}.mp3`);

      setStatus('success');

    } catch (err) {
      console.error('Conversion failed:', err);
      setError('Failed to convert file. The format may not be supported by your browser. Please ensure it is a valid, uncompressed AIFF file.');
      setStatus('error');
    }
  };

  const handleReset = useCallback(() => {
    setStatus('idle');
    setFile(null);
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
      <h2 className="text-3xl font-bold text-green-400">Conversion Complete!</h2>
      <p className="mt-2 text-gray-300 max-w-md mx-auto">Your new MP3 file is ready for download.</p>
      <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
        {mp3BlobUrl && <DownloadButton blobUrl={mp3BlobUrl} fileName={mp3FileName} />}
        <button
            onClick={handleReset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 border-2 border-purple-500 text-purple-400 rounded-lg shadow-md hover:bg-purple-500 hover:text-white transition-all duration-300"
            aria-label="Convert another file"
          >
            Convert Another File
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
              Converting to MP3...
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
          <PromptForm
            onFileSelect={handleFileSelect}
            onConvert={handleConvert}
            file={file}
            isLoading={status === 'converting'}
          />
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
