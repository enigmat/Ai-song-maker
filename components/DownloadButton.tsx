import React, { useState } from 'react';
import type { SingerGender, ArtistType } from '../App';
import type { VocalMelody } from '../services/geminiService';
import { renderStems } from '../services/audioService';

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
  beatPattern: string;
  vocalMelody: VocalMelody | null;
}

interface FilesToInclude {
    lyrics: boolean;
    styleGuide: boolean;
    artistInfo: boolean;
    htmlPlayer: boolean;
    video: boolean;
    image: boolean;
    fullMix: boolean;
    vocals: boolean;
    drums: boolean;
    kick: boolean;
    snare: boolean;
    hihat: boolean;
    clap: boolean;
}

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const DownloadButton: React.FC<DownloadButtonProps> = ({ 
    title, artistName, artistBio, artistVideoUrl, lyrics, styleGuide, singerGender, artistType, bpm, beatPattern, vocalMelody
}) => {
    const [downloadStatus, setDownloadStatus] = useState<'idle' | 'rendering' | 'zipping'>('idle');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filesToInclude, setFilesToInclude] = useState<FilesToInclude>({
        lyrics: true,
        styleGuide: true,
        artistInfo: true,
        htmlPlayer: true,
        video: true,
        image: true,
        fullMix: true,
        vocals: true,
        drums: true,
        kick: false,
        snare: false,
        hihat: false,
        clap: false,
    });

    const handleFileSelectionChange = (file: keyof FilesToInclude, checked: boolean) => {
        setFilesToInclude(prev => {
            const newState = { ...prev, [file]: checked };
            if (file === 'video' && !checked) {
                newState.image = false;
            }
            return newState;
        });
    };

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
                video.currentTime = Math.min(1, video.duration / 2);
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
        if (downloadStatus !== 'idle') return;

        try {
            const zip = new JSZip();

            // Audio Rendering
            const audioStemsToRender = {
                fullMix: filesToInclude.fullMix,
                vocals: filesToInclude.vocals,
                drums: filesToInclude.drums,
                kick: filesToInclude.kick,
                snare: filesToInclude.snare,
                hihat: filesToInclude.hihat,
                clap: filesToInclude.clap,
            };

            const hasAudioToRender = Object.values(audioStemsToRender).some(v => v);

            if (hasAudioToRender) {
                setDownloadStatus('rendering');
                const audioBlobs = await renderStems({ beatPattern, bpm, vocalMelody }, audioStemsToRender);
                 for (const filename in audioBlobs) {
                    zip.file(`audio/${filename}`, audioBlobs[filename]);
                }
            }

            setDownloadStatus('zipping');

            // Other Assets
            if (filesToInclude.lyrics) zip.file("lyrics.txt", lyrics);
            if (filesToInclude.styleGuide) zip.file("style_guide.txt", styleGuide);
            if (filesToInclude.artistInfo) {
                 const artistInfo = `Title: ${title}\nArtist: ${artistName}\nBPM: ${bpm}\n\nBio:\n${artistBio}`;
                 zip.file("artist_info.txt", artistInfo);
            }
            if (filesToInclude.htmlPlayer) zip.file("song_lyrics_viewer.html", createPlayerHTML());

            if (artistVideoUrl) {
                if (filesToInclude.video) {
                    const videoResponse = await fetch(artistVideoUrl);
                    const videoBlob = await videoResponse.blob();
                    zip.file("artist_video.mp4", videoBlob);
                }
                
                if (filesToInclude.image) {
                    const imageBlob = await getVideoFrameAsBlob(artistVideoUrl);
                    if (imageBlob) {
                        zip.file("artist_image.jpg", imageBlob);
                    }
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const fileName = `${artistName.replace(/ /g, '_')}_${title.replace(/ /g, '_')}.zip`.toLowerCase();
            saveAs(content, fileName);

        } catch (error) {
            console.error("Failed to create zip file:", error);
            alert("Sorry, there was an error creating the download package.");
        } finally {
            setDownloadStatus('idle');
            setIsModalOpen(false);
        }
    };
    
    const renderDownloadButtonContent = () => {
        switch (downloadStatus) {
            case 'rendering':
                return (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Rendering...
                    </>
                );
            case 'zipping':
                return (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Zipping...
                    </>
                );
            case 'idle':
            default:
                return 'Download ZIP';
        }
    }

    const CheckboxItem = ({ id, label, checked, onChange, disabled = false, description }: { id: keyof FilesToInclude, label: string, checked: boolean, onChange: (id: keyof FilesToInclude, checked: boolean) => void, disabled?: boolean, description?: string }) => (
        <div className={`relative flex items-start py-3 ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex h-6 items-center">
                <input
                    id={id}
                    name={id}
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={(e) => onChange(id, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-800"
                />
            </div>
            <div className="ml-3 text-sm leading-6">
                <label htmlFor={id} className={`font-medium ${disabled ? 'text-gray-500' : 'text-gray-200'}`}>
                    {label}
                </label>
                {description && <p className="text-gray-400 text-xs">{description}</p>}
            </div>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 rounded-full bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
                aria-label="Download song package"
                title="Download song package"
            >
                <DownloadIcon />
            </button>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" aria-modal="true" role="dialog">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg w-full max-w-lg">
                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            <h2 className="text-xl font-bold text-white">Download Options</h2>
                            <p className="mt-1 text-sm text-gray-400">Select which files to include in the ZIP package.</p>
                            
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <fieldset>
                                    <legend className="text-md font-semibold leading-6 text-gray-200">Assets</legend>
                                    <div className="mt-4 space-y-1 divide-y divide-gray-700">
                                       <CheckboxItem id="lyrics" label="lyrics.txt" checked={filesToInclude.lyrics} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="styleGuide" label="style_guide.txt" checked={filesToInclude.styleGuide} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="artistInfo" label="artist_info.txt" checked={filesToInclude.artistInfo} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="htmlPlayer" label="song_lyrics_viewer.html" checked={filesToInclude.htmlPlayer} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="video" label="artist_video.mp4" checked={filesToInclude.video} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="image" label="artist_image.jpg" checked={filesToInclude.image} onChange={handleFileSelectionChange} disabled={!filesToInclude.video} />
                                    </div>
                                </fieldset>

                                <fieldset>
                                    <legend className="text-md font-semibold leading-6 text-gray-200">Audio Stems (.wav)</legend>
                                    <div className="mt-4 space-y-1 divide-y divide-gray-700">
                                       <CheckboxItem id="fullMix" label="Full Mix" checked={filesToInclude.fullMix} onChange={handleFileSelectionChange} description="Vocals + All Instruments" />
                                       <CheckboxItem id="vocals" label="Vocals" checked={filesToInclude.vocals} onChange={handleFileSelectionChange} description="Isolated vocal track" />
                                       <CheckboxItem id="drums" label="Drums (Combined)" checked={filesToInclude.drums} onChange={handleFileSelectionChange} description="All drum parts mixed" />
                                       <CheckboxItem id="kick" label="Kick" checked={filesToInclude.kick} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="snare" label="Snare" checked={filesToInclude.snare} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="hihat" label="Hi-Hat" checked={filesToInclude.hihat} onChange={handleFileSelectionChange} />
                                       <CheckboxItem id="clap" label="Clap" checked={filesToInclude.clap} onChange={handleFileSelectionChange} />
                                    </div>
                                </fieldset>
                            </div>

                        </div>
                        <div className="bg-gray-800/50 px-6 py-4 flex justify-end items-center gap-4 rounded-b-xl border-t border-gray-700">
                           <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={downloadStatus !== 'idle'}
                                className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                             <button
                                type="button"
                                onClick={handleDownload}
                                disabled={downloadStatus !== 'idle'}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-wait w-28"
                            >
                               {renderDownloadButtonContent()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
