import React, { useState } from 'react';
import type { SingerGender, ArtistType } from '../App';

// TypeScript declarations for global libraries from CDN
declare var JSZip: any;
declare var saveAs: any;

interface DownloadButtonProps {
  title: string;
  artistName: string;
  artistBio: string;
  artistVideoUrl: string;
  lyrics: string;
  styleGuide: string;
  singerGender: SingerGender;
  artistType: ArtistType;
  bpm: number;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ title, artistName, artistBio, artistVideoUrl, lyrics, styleGuide, singerGender, artistType, bpm }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const getVideoFrameAsBlob = (videoUrl: string): Promise<Blob | null> => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.style.display = 'none';
            video.muted = true;
            video.playsInline = true;
            video.preload = 'metadata';
            video.crossOrigin = 'anonymous';
    
            const timeout = setTimeout(() => {
                cleanup();
                resolve(null);
            }, 5000);
    
            const onSeeked = () => {
                clearTimeout(timeout);
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    cleanup();
                    resolve(null);
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    cleanup();
                    resolve(blob);
                }, 'image/jpeg', 0.9);
            };
            
            const onLoadedMetadata = () => {
                video.currentTime = Math.min(1, video.duration / 2); // Seek to 1s or midpoint
            };
    
            const onError = () => {
                clearTimeout(timeout);
                cleanup();
                resolve(null);
            };
            
            const cleanup = () => {
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                video.removeEventListener('seeked', onSeeked);
                video.removeEventListener('error', onError);
                if (video.parentNode) {
                    video.parentNode.removeChild(video);
                }
            };
    
            video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
            video.addEventListener('seeked', onSeeked, { once: true });
            video.addEventListener('error', onError, { once: true });
    
            video.src = videoUrl;
            document.body.appendChild(video);
        });
    };
    
    const createPlayerHTML = (): string => {
        const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        const safeArtistName = artistName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Song Lyrics: ${safeTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111827; color: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
        .container { width: 100%; max-width: 800px; padding: 2rem; background-color: #1f2937; border-radius: 1rem; text-align: center; border: 1px solid #374151; }
        h1 { color: #f9a8d4; font-size: 2.25rem; }
        h2 { color: #a5b4fc; font-size: 1.5rem; margin-top: -0.5rem; }
        #lyrics-container { line-height: 1.7; font-family: serif; max-height: 60vh; overflow-y: auto; text-align: center; margin-top: 1.5rem; padding: 1rem; border: 1px solid #4b5563; border-radius: 0.5rem; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${safeTitle}</h1>
        <h2>by ${safeArtistName}</h2>
        <div id="lyrics-container">
            ${lyrics.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
    </div>
</body>
</html>`;
    };


    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const zip = new JSZip();

            // Add text files
            zip.file("lyrics.txt", lyrics);
            zip.file("style_guide.txt", styleGuide);
            const artistInfo = `Title: ${title}\nArtist: ${artistName}\nBPM: ${bpm}\n\nBio:\n${artistBio}`;
            zip.file("artist_info.txt", artistInfo);

            // Add offline HTML player
            zip.file("song_lyrics_viewer.html", createPlayerHTML());

            // Handle the video and extract a frame for an image
            if (artistVideoUrl) {
                // Fetch video for zip
                const videoResponse = await fetch(artistVideoUrl);
                const videoBlob = await videoResponse.blob();
                zip.file("artist_video.mp4", videoBlob);
                
                // Extract frame for image
                const imageBlob = await getVideoFrameAsBlob(artistVideoUrl);
                if (imageBlob) {
                    zip.file("artist_image.jpg", imageBlob);
                }
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
