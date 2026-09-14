import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyStatBlock } from "../data/statDefinitions";
import { FUSION_BY_ID, MAX_FUSION_TARGETS, fusionRefId } from "../data/fusions";
import { RESEARCH_BY_ID } from "../data/research";
import type { CurrentRunState, StatKey } from "../types/game";

/** Fusions-of-fusions like Deus Ex Machina must be dropped if their prerequisite fusion is deselected. */
function dropOrphanedDependents(fusionTargets: string[]): string[] {
  return fusionTargets.filter((id) => {
    const requiredFusionIds = FUSION_BY_ID[id].requiredMagicIds.map(fusionRefId).filter((v): v is string => v !== null);
    return requiredFusionIds.every((requiredId) => fusionTargets.includes(requiredId));
  });
}

function freshRun(): CurrentRunState {
  return {
    meta: { characterClass: null, subject: null, researchPoints: 0, startedAt: null },
    fusionTargets: [],
    stats: emptyStatBlock(),
    equipped: [],
    acquiredMagicIds: [],
    elapsedMinutes: 0,
    currentLevel: 1,
    enemiesKilled: 0,
    researchLevels: {},
  };
}

interface RunStore {
  run: CurrentRunState;
  setCharacterClass: (value: string | null) => void;
  setSubject: (value: string | null) => void;
  setResearchPoints: (value: number) => void;
  toggleFusionTarget: (fusionId: string) => void;
  setStat: (key: StatKey, value: number) => void;
  nudgeStat: (key: StatKey, delta: number) => void;
  setElapsedMinutes: (minutes: number) => void;
  setCurrentLevel: (level: number) => void;
  setEnemiesKilled: (count: number) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  toggleAcquiredMagic: (magicId: string) => void;
  clearLoadout: () => void;
  addResearchPoints: (amount: number) => void;
  researchUp: (id: string) => void;
  researchDown: (id: string) => void;
  startNewRun: () => void;
}

export const useRunStore = create<RunStore>()(
  persist(
    (set) => ({
      run: freshRun(),

      setCharacterClass: (value) =>
        set((state) => ({ run: { ...state.run, meta: { ...state.run.meta, characterClass: value } } })),

      setSubject: (value) =>
        set((state) => ({ run: { ...state.run, meta: { ...state.run.meta, subject: value } } })),

      setResearchPoints: (value) =>
        set((state) => ({ run: { ...state.run, meta: { ...state.run.meta, researchPoints: Math.max(0, value) } } })),

      toggleFusionTarget: (fusionId) =>
        set((state) => {
          const current = state.run.fusionTargets;
          const isActive = current.includes(fusionId);
          const next = isActive
            ? dropOrphanedDependents(current.filter((id) => id !== fusionId))
            : current.length < MAX_FUSION_TARGETS
              ? [...current, fusionId]
              : current;
          return { run: { ...state.run, fusionTargets: next } };
        }),

      setStat: (key, value) =>
        set((state) => ({ run: { ...state.run, stats: { ...state.run.stats, [key]: value } } })),

      nudgeStat: (key, delta) =>
        set((state) => ({
          run: {
            ...state.run,
            stats: { ...state.run.stats, [key]: Math.max(0, Math.round((state.run.stats[key] + delta) * 100) / 100) },
          },
        })),

      setElapsedMinutes: (minutes) =>
        set((state) => ({ run: { ...state.run, elapsedMinutes: Math.max(0, minutes) } })),

      setCurrentLevel: (level) =>
        set((state) => ({ run: { ...state.run, currentLevel: Math.max(1, Math.round(level)) } })),

      setEnemiesKilled: (count) =>
        set((state) => ({ run: { ...state.run, enemiesKilled: Math.max(0, Math.round(count)) } })),

      equipItem: (itemId) =>
        set((state) => {
          const existing = state.run.equipped.find((e) => e.itemId === itemId);
          const equipped = existing
            ? state.run.equipped.map((e) => (e.itemId === itemId ? { ...e, count: e.count + 1 } : e))
            : [...state.run.equipped, { itemId, count: 1 }];
          return { run: { ...state.run, equipped } };
        }),

      unequipItem: (itemId) =>
        set((state) => ({
          run: { ...state.run, equipped: state.run.equipped.filter((e) => e.itemId !== itemId) },
        })),

      toggleAcquiredMagic: (magicId) =>
        set((state) => {
          const has = state.run.acquiredMagicIds.includes(magicId);
          return {
            run: {
              ...state.run,
              acquiredMagicIds: has
                ? state.run.acquiredMagicIds.filter((id) => id !== magicId)
                : [...state.run.acquiredMagicIds, magicId],
            },
          };
        }),

      clearLoadout: () => set((state) => ({ run: { ...state.run, equipped: [], acquiredMagicIds: [] } })),

      addResearchPoints: (amount) =>
        set((state) => ({
          run: { ...state.run, meta: { ...state.run.meta, researchPoints: Math.max(0, state.run.meta.researchPoints + amount) } },
        })),

      researchUp: (id) =>
        set((state) => {
          const def = RESEARCH_BY_ID[id];
          const current = state.run.researchLevels[id] ?? 0;
          if (!def || state.run.meta.researchPoints <= 0 || current >= def.maxLevel) return state;
          return {
            run: {
              ...state.run,
              meta: { ...state.run.meta, researchPoints: state.run.meta.researchPoints - 1 },
              researchLevels: { ...state.run.researchLevels, [id]: current + 1 },
            },
          };
        }),

      researchDown: (id) =>
        set((state) => {
          const current = state.run.researchLevels[id] ?? 0;
          if (current <= 0) return state;
          return {
            run: {
              ...state.run,
              meta: { ...state.run.meta, researchPoints: state.run.meta.researchPoints + 1 },
              researchLevels: { ...state.run.researchLevels, [id]: current - 1 },
            },
          };
        }),

      startNewRun: () => set({ run: freshRun() }),
    }),
    {
      name: "magic-survival-current-run",
      // Backfill fields added after a user's last save — persist otherwise replaces
      // `run` wholesale instead of merging, so an older persisted run would be
      // missing e.g. researchLevels and crash screens that read it.
      merge: (persisted, current) => {
        const persistedRun = (persisted as Partial<RunStore> | undefined)?.run;
        return {
          ...current,
          run: {
            ...current.run,
            ...persistedRun,
            meta: { ...current.run.meta, ...persistedRun?.meta },
            stats: { ...current.run.stats, ...persistedRun?.stats },
            researchLevels: { ...current.run.researchLevels, ...persistedRun?.researchLevels },
          },
        };
      },
    }
  )
);
