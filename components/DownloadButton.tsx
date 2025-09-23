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
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ title, artistName, artistBio, artistVideoUrl, lyrics, styleGuide, singerGender, artistType }) => {
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
        const safeTitle = title.replace(/`/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const safeArtistName = artistName.replace(/`/g, "'").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Song Player: ${safeTitle}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111827; color: #e5e7eb; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
        .container { width: 100%; max-width: 800px; padding: 2rem; background-color: #1f2937; border-radius: 1rem; text-align: center; border: 1px solid #374151; }
        h1 { color: #f9a8d4; font-size: 2.25rem; }
        h2 { color: #a5b4fc; font-size: 1.5rem; margin-top: -0.5rem; }
        #lyrics-container { line-height: 1.7; font-family: serif; max-height: 50vh; overflow-y: auto; text-align: center; margin-top: 1.5rem; padding: 1rem; border: 1px solid #4b5563; border-radius: 0.5rem; }
        #lyrics-container p { margin: 0.5rem 0; transition: all 0.3s ease; }
        .current-line { background-color: #6d28d9; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; transform: scale(1.05); }
        button { background-color: #8b5cf6; color: white; border: none; padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 9999px; cursor: pointer; transition: all 0.3s; font-weight: 600; }
        button:hover { background-color: #7c3aed; transform: scale(1.05); }
        button:disabled { background-color: #4b5563; cursor: not-allowed; transform: none; }
        #status { margin-top: 1rem; margin-bottom: 1rem; color: #9ca3af; height: 1.25rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${safeTitle}</h1>
        <h2>by ${safeArtistName}</h2>
        <div id="status">Loading voices...</div>
        <button id="play-button" disabled>Play Song</button>
        <div id="lyrics-container">
            ${lyrics.split('\n').map(line => `<p>${line.replace(/</g, "&lt;").replace(/>/g, "&gt;") || '&nbsp;'}</p>`).join('')}
        </div>
    </div>
    <script>
        const songData = {
            lyrics: ${JSON.stringify(lyrics)},
            singerGender: '${singerGender}',
            artistType: '${artistType}'
        };

        const playButton = document.getElementById('play-button');
        const statusEl = document.getElementById('status');
        const lyricsContainer = document.getElementById('lyrics-container');
        const lyricLines = Array.from(lyricsContainer.getElementsByTagName('p'));

        let isPlaying = false;
        let voices = [];
        let isPlayingRef = { current: false };

        function stopSpeech() {
            isPlayingRef.current = false;
            window.speechSynthesis.cancel();
            isPlaying = false;
            playButton.textContent = 'Play Song';
            lyricLines.forEach(el => el.classList.remove('current-line'));
        };

        function startPlayback() {
            if (voices.length === 0) {
                statusEl.textContent = 'No speech voices available.';
                return;
            }
            
            const allLines = songData.lyrics.split('\\n');
            const speakableLines = allLines
                .map((line, index) => ({ line, originalIndex: index }))
                .filter(item => item.line.trim() !== '' && !/^\\s*\\[.*\\]\\s*$/.test(item.line));

            if (speakableLines.length === 0) return;

            const englishVoices = voices.filter(v => v.lang.startsWith('en'));
            if (englishVoices.length === 0) {
                statusEl.textContent = "No English voices found for playback.";
                return;
            }
            
            let selectedVoice = null, maleVoice = null, femaleVoice = null;

            if (songData.artistType === 'Duet') {
                const preferredFemale = englishVoices.filter(v => v.name.toLowerCase().includes('female'));
                femaleVoice = preferredFemale.length > 0 ? preferredFemale[0] : englishVoices.find(v => !v.name.toLowerCase().includes('male')) || englishVoices[0];
                
                const preferredMale = englishVoices.filter(v => v.name.toLowerCase().includes('male'));
                maleVoice = preferredMale.length > 0 ? preferredMale[0] : englishVoices.find(v => !v.name.toLowerCase().includes('female')) || englishVoices[0];
            } else {
                let preferredVoices = songData.singerGender === 'Female'
                    ? englishVoices.filter(v => v.name.toLowerCase().includes('female') || !v.name.toLowerCase().includes('male'))
                    : englishVoices.filter(v => v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female'));
                selectedVoice = preferredVoices.length > 0 ? preferredVoices[0] : englishVoices[0];
            }

            isPlaying = true;
            isPlayingRef.current = true;
            playButton.textContent = 'Stop';
            statusEl.textContent = 'Playing...';
            let lineIndex = 0;

            const speakLine = () => {
                if (!isPlayingRef.current || lineIndex >= speakableLines.length) {
                    stopSpeech();
                    statusEl.textContent = 'Playback finished.';
                    return;
                }

                const currentItem = speakableLines[lineIndex];
                lyricLines.forEach((el, idx) => {
                    el.classList.toggle('current-line', idx === currentItem.originalIndex);
                    if (idx === currentItem.originalIndex) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                
                let lineText = currentItem.line;
                let voiceForLine = selectedVoice;

                if (songData.artistType === 'Duet') {
                    if (lineText.toLowerCase().includes('(singer 1)')) voiceForLine = femaleVoice;
                    else if (lineText.toLowerCase().includes('(singer 2)')) voiceForLine = maleVoice;
                    else voiceForLine = femaleVoice;
                    lineText = lineText.replace(/\\((singer 1|singer 2|both)\\)/i, '').trim();
                }

                if (!lineText) { lineIndex++; speakLine(); return; }
                
                const utterance = new SpeechSynthesisUtterance(lineText);
                utterance.rate = 0.9;
                
                if (voiceForLine) {
                    const isFemale = voiceForLine.name.toLowerCase().includes('female');
                    const basePitch = isFemale ? 1.2 : 0.8;
                    utterance.pitch = basePitch + (Math.random() * 0.2 - 0.1);
                    utterance.voice = voiceForLine;
                }
                
                utterance.onend = () => { lineIndex++; speakLine(); };
                utterance.onerror = (e) => { console.error('Speech error', e); statusEl.textContent = 'An error occurred.'; stopSpeech(); };
                window.speechSynthesis.speak(utterance);
            };
            speakLine();
        }

        playButton.addEventListener('click', () => isPlaying ? stopSpeech() : startPlayback());

        function loadVoices() {
            voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                playButton.disabled = false;
                statusEl.textContent = 'Ready to play.';
            }
        }
        
        if (!('speechSynthesis' in window)) {
            statusEl.textContent = 'Speech synthesis not supported by this browser.';
        } else {
            loadVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
             if (voices.length === 0) {
                setTimeout(loadVoices, 200); // Sometimes voices load slowly
            }
        }
    <\/script>
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
            const artistInfo = `Title: ${title}\nArtist: ${artistName}\n\nBio:\n${artistBio}`;
            zip.file("artist_info.txt", artistInfo);

            // Add offline HTML player
            zip.file("song_player.html", createPlayerHTML());

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