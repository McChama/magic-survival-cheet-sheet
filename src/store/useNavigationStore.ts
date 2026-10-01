import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Screen =
  | "home"
  | "subject"
  | "class"
  | "dashboard"
  | "research"
  | "runs"
  | "dropProbability"
  | "recommender"
  | "ownedMagic"
  | "ownedArtifact"
  | "synergy"
  | "magicCombination";

interface NavigationStore {
  screen: Screen;
  setScreen: (screen: Screen) => void;
}

/** Just which top-level screen `App.tsx` is showing, persisted separately from the run itself (`useRunStore`) so a
 *  reload resumes on the screen the player was looking at instead of always bouncing back to Home. */
export const useNavigationStore = create<NavigationStore>()(
  persist(
    (set) => ({
      screen: "home",
      setScreen: (screen) => set({ screen }),
    }),
    // index.html reads this same key before the bundle loads, to preload Home's title art only when Home is the
    // screen about to open — rename it there too.
    { name: "magic-survival-navigation" },
  ),
);
