import type { SingerGender, ArtistType } from '../services/geminiService';

export const genres = [
    'Pop', 'Rock', 'Hip Hop / Rap', 'R&B / Soul', 'Electronic', 'Country', 'Jazz', 'Classical', 'Latin', 'Metal', 'Indie', 'Alternative', 'Folk', 'Acoustic', 'Afrobeat', 'Ambient', 'Blues', 'Club', 'Dance', 'Dancehall', 'Disco', 'Drum & Bass', 'Dubstep', 'Funk', 'Gospel', 'House', 'Instrumental', 'Lo-fi', 'Punk', 'Reggae', 'Synthwave', 'Techno', 'Trance', 'Trap'
];

export const moods = [
    'Upbeat', 'Melancholic', 'Driving', 'Relaxing', 'Energetic', 'Atmospheric', 'Romantic', 'Introspective', 'Aggressive', 'Hopeful', 'Dark', 'Mysterious', 'Nostalgic', 'Experimental', 'Chill', 'Funky', 'Dreamy', 'Epic', 'Minimalist'
];

export const tempos = [
    'Very Slow (40-60 BPM)',
    'Slow (60-80 BPM)',
    'Medium (80-120 BPM)',
    'Fast (120-160 BPM)',
    'Very Fast (160+ BPM)',
];

export const melodies = [
    'Simple and Catchy',
    'Complex and Technical',
    'Improvisational',
    'Lyrical and Flowing',
    'Melismatic and Ornate',
    'Monophonic'
];

export const harmonies = [
    'Diatonic and Simple',
    'Chromatic and Complex',
    'Modal',
    'Atonal',
    'Consonant and Sweet',
    'Dissonant and Tense'
];

export const rhythms = [
    'Steady and Driving',
    'Syncopated and Funky',
    'Polyrhythmic',
    'Loose and Rubato',
    'Straightforward 4/4',
    'Complex Time Signatures'
];

export const instrumentations = [
    'Acoustic',
    'Electronic',
    'Orchestral',
    'Rock Band',
    'Jazz Ensemble',
    'Minimalist',
    'Synth-heavy',
    'World Music'
];

export const atmospheres = [
    'Spacious and Reverb-heavy',
    'Dry and Intimate',
    'Distorted and Gritty',
    'Clean and Polished',
    'Ethereal and Dreamy',
    'Dark and Moody',
    'Lo-fi and Hazy'
];

export const vocalStyles = [
    'Clear & Melodic',
    'Rhythmic & Spoken',
    'Aggressive & Raspy',
    'Soft & Gentle',
    'Operatic'
];

export const singerGenders: { value: SingerGender, label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-Binary' },
];

export const artistTypes: { value: ArtistType, label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'solo', label: 'Solo' },
    { value: 'band', label: 'Band' },
    { value: 'duo', label: 'Duo' },
];

export const musicalKeys = [
    'C Major / A Minor',
    'G Major / E Minor',
    'D Major / B Minor',
    'A Major / F# Minor',
    'E Major / C# Minor',
    'B Major / G# Minor',
    'F# Major / D# Minor',
    'C# Major / A# Minor',
    'F Major / D Minor',
    'Bb Major / G Minor',
    'Eb Major / C Minor',
    'Ab Major / F Minor',
    'Db Major / Bb Minor',
    'Gb Major / Eb Minor',
    'Cb Major / Ab Minor',
];