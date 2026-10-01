/**
 * True inside the Android companion (`android/`): its WebView injects `MSCompanionHost` before the page loads
 * (see `capture/bridge.ts`), a plain browser never has it.
 *
 * There the app is a window over the real game, so it doesn't repeat what the game already has: no Home, no
 * "Start Game", no Class / Subject / Research menus — those are set in the game and read from it. What is left is
 * what the game can't show: the Runs list and a run's Dashboard with everything under it (`App.tsx`).
 */
export const IS_COMPANION = typeof window !== "undefined" && !!window.MSCompanionHost;
