import React, { useState, useEffect, useRef } from 'react';
import type { SongData } from '../services/geminiService';

interface DownloadMenuProps {
    songData: SongData;
    artistImageUrl: string;
    videoUrl: string;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


export const DownloadMenu: React.FC<DownloadMenuProps> = ({ songData, artistImageUrl, videoUrl }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [blobUrls, setBlobUrls] = useState<{ [key: string]: string }>({});
    const menuRef = useRef<HTMLDivElement>(null);

    const { title, artistName, lyrics, styleGuide } = songData;
    const sanitizedArtistName = artistName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const baseFileName = `${sanitizedArtistName}_${sanitizedTitle}`;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Create blob URLs when menu opens.
        if (isOpen) {
            const lyricsBlob = new Blob([lyrics], { type: 'text/plain;charset=utf-8' });
            const styleGuideBlob = new Blob([styleGuide], { type: 'text/plain;charset=utf-8' });
            const jsonDataToSave = { ...songData, artistImageUrl, videoUrl };
            const jsonBlob = new Blob([JSON.stringify(jsonDataToSave, null, 2)], { type: 'application/json' });

            const urls = {
                lyrics: URL.createObjectURL(lyricsBlob),
                styleGuide: URL.createObjectURL(styleGuideBlob),
                jsonData: URL.createObjectURL(jsonBlob),
            };
            setBlobUrls(urls);
        } else {
            // Revoke blob URLs when menu closes.
            Object.values(blobUrls).forEach(URL.revokeObjectURL);
            setBlobUrls({});
        }

        // Cleanup function to revoke URLs on unmount.
        return () => {
            Object.values(blobUrls).forEach(URL.revokeObjectURL);
        };
    }, [isOpen, lyrics, styleGuide, songData, artistImageUrl, videoUrl]);

    const downloadOptions = [
        {
            label: 'Lyrics (.txt)',
            href: blobUrls.lyrics,
            fileName: `${baseFileName}_lyrics.txt`,
            available: !!lyrics
        },
        {
            label: 'Style Guide (.txt)',
            href: blobUrls.styleGuide,
            fileName: `${baseFileName}_style_guide.txt`,
            available: !!styleGuide
        },
        {
            label: 'All Data (.json)',
            href: blobUrls.jsonData,
            fileName: `${baseFileName}_data.json`,
            available: true
        },
        {
            label: 'Artist Image (.jpeg)',
            href: artistImageUrl,
            fileName: `${baseFileName}_image.jpeg`,
            available: !!artistImageUrl
        },
        {
            label: 'Music Video (.mp4)',
            href: videoUrl,
            fileName: `${baseFileName}_video.mp4`,
            available: !!videoUrl
        },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-teal-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Download assets"
                title="Download Assets"
            >
                <DownloadIcon />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 border border-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in-fast">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {downloadOptions.map((option) => (
                            option.available ? (
                                <a
                                    key={option.label}
                                    href={option.href}
                                    download={option.fileName}
                                    onClick={() => setTimeout(() => setIsOpen(false), 100)} // Close menu after click
                                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full text-left"
                                    role="menuitem"
                                >
                                    {option.label}
                                </a>
                            ) : null
                        ))}
                    </div>
                </div>
            )}
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.1s ease-out forwards;
                }
            `}</style>
        </div>
    );
};
