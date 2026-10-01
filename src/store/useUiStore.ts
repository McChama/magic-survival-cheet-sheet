import { create } from "zustand";

/** Transient UI state shared across components — never persisted (unlike the run itself in `useRunStore`). */
interface UiState {
  /** A full-screen sheet is open over the Dashboard (the "+" menu): the floating Magic Circle bubble steps out of its way. */
  hideMagicCircleBubble: boolean;
  setHideMagicCircleBubble: (hide: boolean) => void;
  /**
   * Inside the Android companion: its panel is off-screen (the player is in the game). Nobody can see the app
   * then, so whatever animates on a timer stops — a phone running the game has no cycles to spare for it.
   * Always false in a browser.
   */
  parked: boolean;
  setParked: (parked: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  hideMagicCircleBubble: false,
  setHideMagicCircleBubble: (hide) => set({ hideMagicCircleBubble: hide }),
  parked: false,
  setParked: (parked) => set({ parked }),
}));
