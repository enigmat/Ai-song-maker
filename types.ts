import type { SingerGender, ArtistType, VocalMelody, ArtistStyleProfile } from './services/geminiService';

export interface SongData {
    title: string;
    artistName: string;
    artistBio: string;
    albumCoverPrompt: string;
    lyrics: string;
    styleGuide: string;
    beatPattern: string;
    singerGender: SingerGender;
    artistType: ArtistType;
    vocalMelody: VocalMelody | null;
    bpm: number;
    genre: string;
    storyboard: string;
}

export interface AlbumData {
    albumTitle: string;
    artistName: string;
    artistBio: string;
    albumCoverPrompt: string;
    albumCoverUrl: string;
    tracks: SongData[];
}

export interface Project {
  id: string; // unique ID, e.g., timestamp
  name: string;
  createdAt: string;
  updatedAt: string;
  songData: SongData | null;
  artistImageUrl: string | null;
  videoUrl: string | null;
  generationParams: ArtistStyleProfile | null;
  originalPrompt: string | null;
}

export interface SongSection {
  type: string; // 'Verse 1', 'Chorus', etc.
  lyrics: string;
  suggestion?: string;
}

export interface SongStructureAnalysis {
  overallFeedback: string;
  sections: SongSection[];
}