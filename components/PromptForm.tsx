import React, { useState, useCallback, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  onConvert: () => void;
  file: File | null;
  isLoading: boolean;
  accept: string;
  promptText: string;
  buttonText: string;
}

const UploadIcon = () => (
  <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8a4 4 0 01-4 4H28m0-28v8a4 4 0 004 4h8m-8-8l8 8m-8-8l-8 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" strokeWidth="1.5" stroke="currentColor" fill="none" />
  </svg>
);


export const PromptForm: React.FC<FileUploadProps> = ({ onFileSelect, onConvert, file, isLoading, accept, promptText, buttonText }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileSelect]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert();
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className={`p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
            ${isDragging ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          <div className="text-center">
            <UploadIcon />
            <p className="mt-2 text-lg font-semibold text-gray-300">
              {promptText}
            </p>
            <p className="mt-1 text-sm text-gray-400">or click to select a file</p>
          </div>
        </div>
        
        {file && (
            <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-center">
                <p className="text-gray-300">Selected file: <span className="font-semibold text-teal-400">{file.name}</span></p>
            </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !file}
          className="mt-6 w-full flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              Processing...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 6l12-3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {buttonText}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
