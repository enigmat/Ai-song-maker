// Type definitions, matching the expected structure from the AI.
export type SingerGender = 'male' | 'female' | 'non-binary' | 'any';
export type ArtistType = 'solo' | 'band' | 'duo' | 'any';
export type VocalMelody = Record<string, any>; // Placeholder for a more complex type if needed

// Defines the parameters that make up an artist's signature style.
export interface ArtistStyleProfile {
  genre: string;
  singerGender: SingerGender;
  artistType: ArtistType;
  mood: string;
  tempo: string;
  melody: string;
  harmony: string;
  rhythm: string;
  instrumentation: string;
  atmosphere: string;
  vocalStyle: string;
}

// This defines a single song saved under an artist
export interface ArtistSong {
    title: string;
    songPrompt: string;
    lyrics: string;
    albumCoverPrompt: string;
    createdAt: string; // ISO Date string
}

// This is the structure of the value in our localStorage dictionary
export interface StoredArtistProfile {
    style: ArtistStyleProfile;
    songs: ArtistSong[];
}

// New type for hummed melody notes
export interface MelodyNote {
    pitch: string; // e.g., "C4"
    startTime: number; // in seconds
    duration: number; // in seconds
}

export interface MelodyAnalysis {
    bpm: number;
    notes: MelodyNote[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// New type for the album details result
export interface AlbumConcept {
    artistBio: string;
    albumCoverPrompt: string;
    artistImagePrompt: string;
}

export interface YouTubeAssets {
    title: string;
    description: string;
    tags: string[];
    thumbnailPrompts: string[];
}

export interface RemixResult {
    profile: ArtistStyleProfile;
    newCreativePrompt: string;
}

export interface Ratings {
    commercialPotential: { score: number; justification: string };
    originality: { score: number; justification: string };
    composition: { score: number; justification: string };
    productionQuality: { score: number; justification: string };
}
export interface Marketability {
    targetAudience: string;
    playlistFit: string[];
    syncPotential: string;
}
export interface AnalysisReport {
    ratings: Ratings;
    pros: string[];
    cons: string[];
    summary: string;
    marketability: Marketability;
}

export interface SongComparisonMetrics {
    commercialPotential: { score: number; justification: string };
    originality: { score: number; justification: string };
    composition: { score: number; justification: string };
    productionQuality: { score: number; justification: string };
    summary: string;
}
export interface ComparisonReport {
    overallWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    marketabilityWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    spotifyWinner: { song: 'song1' | 'song2' | 'tie'; justification: string };
    song1Analysis: SongComparisonMetrics;
    song2Analysis: SongComparisonMetrics;
    recommendationsForSong1: string[];
    recommendationsForSong2: string[];
}

export interface ChordProgression {
    progression: string;
    description: string;
    theoryExplanation: string;
}

export interface ArtistPersona {
  artistName: string;
  artistBio: string;
  artistImagePrompt: string;
  visualIdentityPrompt: string;
  styleProfile: ArtistStyleProfile;
  signatureSongConcepts: string[];
}

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

export interface RolloutTask {
  task: string;
  description: string;
}

export interface RolloutTimeframe {
  timeframe: string;
  tasks: RolloutTask[];
}

export interface SocialMediaIdea {
  platform: string;
  ideas: string[];
}

export interface EmailSnippet {
  subject: string;
  body: string;
}

export interface RolloutPlan {
  rollout: RolloutTimeframe[];
  socialMediaContent: SocialMediaIdea[];
  emailSnippets: EmailSnippet[];
}

export interface ListenerProfileSection {
  title: string;
  details: string[];
}

export interface ListenerProfile {
  archetypeName: string;
  description: string;
  demographics: ListenerProfileSection;
  psychographics: ListenerProfileSection;
  musicHabits: ListenerProfileSection;
}

export interface PressRelease {
  headline: string;
  dateline: string; // e.g., "LOS ANGELES, CA"
  introduction: string; // First paragraph
  body: string; // Middle paragraphs, combined as a single string with newlines
  quote: string; // A simulated quote from the artist
  aboutArtist: string; // The boilerplate
  callToAction: string; // E.g., "The single is available on all major streaming platforms."
}

export interface SocialMediaKit {
    profilePicture: string; // base64 data URL
    postImage: string; // base64 data URL
    storyImage: string; // base64 data URL
    headerImage: string; // base64 data URL
    thumbnailImage: string; // base64 data URL
}

export interface SoundPackItem {
    genre: string;
    newLyrics: string;
    styleGuide: string;
    creativeConcept: string;
}
