import { createContext } from 'react';

export interface PlaybackContextType {
  play: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  isPlaying: boolean;
}

const defaultState: PlaybackContextType = {
  play: () => console.warn('PlaybackContext: play function not yet initialized'),
  stop: () => console.warn('PlaybackContext: stop function not yet initialized'),
  setBpm: () => console.warn('PlaybackContext: setBpm function not yet initialized'),
  isPlaying: false,
};

export const PlaybackContext = createContext<PlaybackContextType>(defaultState);
