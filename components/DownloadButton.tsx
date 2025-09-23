import React, { useState } from 'react';

// TypeScript declarations for global libraries from CDN
declare var JSZip: any;
declare var saveAs: any;

interface DownloadButtonProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistImageUrl: string;
  lyrics: string;
  styleGuide: string;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ title, artistName, artistBio, artistImageUrl, lyrics, styleGuide }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const zip = new JSZip();

            // Add text files
            zip.file("lyrics.txt", lyrics);
            zip.file("style_guide.txt", styleGuide);
            const artistInfo = `Title: ${title}\nArtist: ${artistName}\n\nBio:\n${artistBio}`;
            zip.file("artist_info.txt", artistInfo);

            // Handle the image (it's a data URL), fetch it and add to zip
            if (artistImageUrl) {
                const imageResponse = await fetch(artistImageUrl);
                const imageBlob = await imageResponse.blob();
                zip.file("artist_image.jpeg", imageBlob);
            }

            // Generate and save the zip
            const content = await zip.generateAsync({ type: "blob" });
            const fileName = `${artistName.replace(/ /g, '_')}_${title.replace(/ /g, '_')}.zip`.toLowerCase();
            saveAs(content, fileName);

        } catch (error) {
            console.error("Failed to create zip file:", error);
            alert("Sorry, there was an error creating the download package.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-wait"
            aria-label="Download song package"
            title="Download song package"
        >
            {isDownloading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <DownloadIcon />
            )}
        </button>
    );
};