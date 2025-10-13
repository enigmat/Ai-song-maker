import type { SingerGender, ArtistType } from '../types';

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

export const styleFieldDescriptions = {
    genre: "Defines the song's overall sound, structure, and instrumentation. For example, 'Synthwave' will feature synthesizers, while 'Acoustic' will be more organic.",
    singerGender: "Influences the vocal tone and range the AI will aim for in its style description.",
    artistType: "The configuration of the musical act. A 'Solo' artist might have a more intimate sound, while a 'Band' could have a fuller, layered arrangement.",
    mood: "The dominant emotion the song evokes. 'Upbeat' often leads to faster tempos and major keys, whereas 'Melancholic' will likely result in slower tempos and minor keys.",
    tempo: "The speed of the music, measured in Beats Per Minute (BPM). This is a crucial element in defining a song's energy level, from a slow ballad to a fast-paced dance track.",
    melody: "The main musical tune that a listener often remembers. 'Simple and Catchy' is great for pop hooks, while 'Complex and Technical' might be better for jazz or progressive rock.",
    harmony: "The combination of notes played simultaneously to create chords. 'Diatonic and Simple' harmony feels stable and predictable, while 'Dissonant and Tense' harmony creates unease or complexity.",
    rhythm: "The song's beat and groove. 'Steady and Driving' is common in rock music, while 'Syncopated and Funky' adds a more complex, danceable feel.",
    instrumentation: "The selection of instruments used in the music. This choice is fundamental to the song's genre and texture. For example, 'Rock Band' implies guitars, bass, and drums.",
    atmosphere: "The sonic texture created by production effects like reverb or distortion. 'Spacious and Reverb-heavy' creates a sense of vastness, while 'Dry and Intimate' feels close and personal.",
    vocalStyle: "The specific manner of singing. 'Clear & Melodic' focuses on the tune, while 'Rhythmic & Spoken' is closer to rap. This heavily influences the performance's character."
};

export const instrumentOptions = {
    Drums: ['808 Kit', '909 Kit', 'Acoustic Rock Kit', 'Vintage Funk Kit', 'Lo-fi Hip Hop Kit', 'Trap Kit', 'LinnDrum Machine'],
    Bass: ['Deep 808 Sub Bass', 'Electric Funk Slap Bass', 'Upright Jazz Bass', 'Acid Synth Bass', 'Moog-style Synth Bass', 'Muted Electric Bass'],
    Strings: ['Cinematic Violins Section', 'Pizzicato String Plucks', 'Intimate String Quartet', 'Lush Synth Pad', 'Orchestral Swells'],
    Horns: ['Solo Jazz Saxophone', 'Powerful Brass Section Hits', 'Muted Trumpet Solo', 'Synth Brass Stabs'],
    Guitar: ['Clean Jazz Guitar Chords', 'Distorted Rock Power Chords', 'Acoustic Folk Strumming', 'Funky Wah-Wah Guitar'],
    Keys: ['Grand Piano Melody', 'Electric Rhodes Piano', 'Classic B3 Organ Licks', 'Synth Arpeggio Sequence']
};

export const beatStyles = [
    'Clean & Polished',
    'Gritty & Distorted',
    'Minimal & Sparse',
    'Complex & Layered',
    'Organic & Live',
    'Synthetic & Electronic'
];

export const beatRegions = [
    'None',
    'West Coast G-Funk',
    'East Coast Boom Bap',
    'Southern Trap',
    'UK Grime/Drill',
    'Latin Reggaeton',
    'Jamaican Dancehall',
    'Afrobeat',
];