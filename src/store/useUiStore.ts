import { create } from "zustand";

/** Transient UI state shared across components — never persisted (unlike the run itself in `useRunStore`). */
interface UiState {
  /** A full-screen sheet is open over the Dashboard (the "+" menu): the floating Magic Circle bubble steps out of its way. */
  hideMagicCircleBubble: boolean;
  setHideMagicCircleBubble: (hide: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  hideMagicCircleBubble: false,
  setHideMagicCircleBubble: (hide) => set({ hideMagicCircleBubble: hide }),
}));
