import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistImageUrl: string;
  lyrics: string;
  styleGuide: string;
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);


export const ShareButton: React.FC<ShareButtonProps> = ({ title, artistName, artistBio, artistImageUrl, lyrics, styleGuide }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleShare = async () => {
        const songData = {
            title,
            artistName,
            artistBio,
            artistImageUrl,
            lyrics,
            styleGuide,
        };

        const serializedData = JSON.stringify(songData);
        const encodedData = btoa(serializedData);
        const shareUrl = `${window.location.origin}${window.location.pathname}?song=${encodedData}`;

        const sharePayload = {
            title: `Check out "${title}" by ${artistName}`,
            text: "I made this song with AI Song Maker! Check it out.",
            url: shareUrl,
        };

        if (navigator.share) {
            try {
                await navigator.share(sharePayload);
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (error) {
                console.error('Failed to copy URL:', error);
                alert('Failed to copy link to clipboard.');
            }
        }
    };

    return (
        <button
            onClick={handleShare}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            aria-label="Share song"
            title={isCopied ? "Link Copied!" : "Share Song"}
        >
            {isCopied ? <CheckIcon /> : <ShareIcon />}
        </button>
    );
};
