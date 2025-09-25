import React from 'react';

interface DownloadButtonProps {
    blobUrl: string;
    fileName: string;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ blobUrl, fileName }) => {
    return (
        <a
            href={blobUrl}
            download={fileName}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-lg font-semibold px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg shadow-md hover:from-teal-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105"
            aria-label={`Download ${fileName}`}
        >
            <DownloadIcon />
            <span>Download MP3</span>
        </a>
    );
};
