import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyStatBlock } from "../data/statDefinitions";
import { FUSION_BY_ID, MAX_FUSION_TARGETS, fusionRefId } from "../data/fusions";
import { RESEARCH_BY_ID, TOTAL_RESEARCH_POINTS } from "../data/research";
import { ALWAYS_UNLOCKED_SUBJECT, SUBJECTS } from "../data/classes";
import { computeStartingStats } from "../engine/runStats";
import type { CurrentRunState, StatKey } from "../types/game";

/** Default Test Subject for a fresh run — always the first entry ("Wizard"), never unset. */
const DEFAULT_SUBJECT = SUBJECTS[0];

/** Fusions-of-fusions like Deus Ex Machina must be dropped if their prerequisite fusion is deselected. */
function dropOrphanedDependents(fusionTargets: string[]): string[] {
  return fusionTargets.filter((id) => {
    const requiredFusionIds = FUSION_BY_ID[id].requiredMagicIds.map(fusionRefId).filter((v): v is string => v !== null);
    return requiredFusionIds.every((requiredId) => fusionTargets.includes(requiredId));
  });
}

function freshRun(): CurrentRunState {
  return {
    meta: { characterClass: null, classLevels: {}, subject: DEFAULT_SUBJECT, unlockedSubjects: [], researchPoints: TOTAL_RESEARCH_POINTS, startedAt: null },
    fusionTargets: [],
    statAdjustments: emptyStatBlock(),
    equipped: [],
    acquiredMagicIds: [],
    magicLevels: {},
    magicTalents: {},
    elapsedMinutes: 0,
    currentLevel: 1,
    enemiesKilled: 0,
    magicCircleActive: false,
    researchLevels: {},
  };
}

interface RunStore {
  run: CurrentRunState;
  setCharacterClass: (value: string | null) => void;
  /** Sets `className`'s own level (1-5), independent of every other class's level. */
  setClassLevel: (className: string, level: number) => void;
  setSubject: (value: string) => void;
  toggleSubjectUnlocked: (name: string) => void;
  setResearchPoints: (value: number) => void;
  toggleFusionTarget: (fusionId: string) => void;
  setStat: (key: StatKey, value: number) => void;
  setElapsedMinutes: (minutes: number) => void;
  setCurrentLevel: (level: number) => void;
  setEnemiesKilled: (count: number) => void;
  setMagicCircleActive: (active: boolean) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  toggleAcquiredMagic: (magicId: string) => void;
  /** Clamps to >= 1 — no upper bound, the real in-game max level isn't datamined here. */
  setMagicLevel: (magicId: string, level: number) => void;
  /** `null` clears a previously-recorded talent choice. */
  setMagicTalent: (magicId: string, talentName: string | null) => void;
  clearLoadout: () => void;
  researchUp: (id: string) => void;
  researchDown: (id: string) => void;
  /** Sets every research node back to level 0 and refunds all the points. */
  resetResearch: () => void;
  startNewRun: () => void;
}

export const useRunStore = create<RunStore>()(
  persist(
    (set) => ({
      run: freshRun(),

      setCharacterClass: (value) =>
        set((state) => ({ run: { ...state.run, meta: { ...state.run.meta, characterClass: value } } })),

      setClassLevel: (className, level) =>
        set((state) => ({
          run: {
            ...state.run,
            meta: {
              ...state.run.meta,
              classLevels: { ...state.run.meta.classLevels, [className]: Math.min(5, Math.max(1, Math.round(level))) },
            },
          },
        })),

      setSubject: (value) =>
        set((state) => ({ run: { ...state.run, meta: { ...state.run.meta, subject: value } } })),

      toggleSubjectUnlocked: (name) =>
        set((state) => {
          if (name === ALWAYS_UNLOCKED_SUBJECT) return state;
          const current = state.run.meta.unlockedSubjects;
          const unlockedSubjects = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
          return { run: { ...state.run, meta: { ...state.run.meta, unlockedSubjects } } };
        }),

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
        set((state) => ({
          run: { ...state.run, statAdjustments: { ...state.run.statAdjustments, [key]: Math.round((value - computeStartingStats(state.run)[key]) * 100) / 100 } },
        })),

      setElapsedMinutes: (minutes) =>
        set((state) => ({ run: { ...state.run, elapsedMinutes: Math.max(0, minutes) } })),

      setCurrentLevel: (level) =>
        set((state) => ({ run: { ...state.run, currentLevel: Math.max(1, Math.round(level)) } })),

      setMagicCircleActive: (active) => set((state) => ({ run: { ...state.run, magicCircleActive: active } })),

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
          if (has) {
            // Drop the level/talent record too — a re-added magic starts fresh rather
            // than silently resurfacing a stale level/talent from a previous pickup.
            const { [magicId]: _level, ...magicLevels } = state.run.magicLevels;
            const { [magicId]: _talent, ...magicTalents } = state.run.magicTalents;
            return {
              run: {
                ...state.run,
                acquiredMagicIds: state.run.acquiredMagicIds.filter((id) => id !== magicId),
                magicLevels,
                magicTalents,
              },
            };
          }
          return {
            run: { ...state.run, acquiredMagicIds: [...state.run.acquiredMagicIds, magicId] },
          };
        }),

      setMagicLevel: (magicId, level) =>
        set((state) => ({
          run: { ...state.run, magicLevels: { ...state.run.magicLevels, [magicId]: Math.max(1, Math.round(level)) } },
        })),

      setMagicTalent: (magicId, talentName) =>
        set((state) => {
          if (talentName === null) {
            const { [magicId]: _removed, ...magicTalents } = state.run.magicTalents;
            return { run: { ...state.run, magicTalents } };
          }
          return { run: { ...state.run, magicTalents: { ...state.run.magicTalents, [magicId]: talentName } } };
        }),

      clearLoadout: () =>
        set((state) => ({
          run: { ...state.run, equipped: [], acquiredMagicIds: [], magicLevels: {}, magicTalents: {}, magicCircleActive: false },
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

      resetResearch: () =>
        set((state) => ({
          run: { ...state.run, meta: { ...state.run.meta, researchPoints: TOTAL_RESEARCH_POINTS }, researchLevels: {} },
        })),

      startNewRun: () => set({ run: freshRun() }),
    }),
    {
      name: "magic-survival-current-run",
      // Backfill fields added after a user's last save — persist otherwise replaces
      // `run` wholesale instead of merging, so an older persisted run would be
      // missing e.g. researchLevels and crash screens that read it.
      merge: (persisted, current) => {
        const persistedRun = (persisted as Partial<RunStore> | undefined)?.run;
        const researchLevels = { ...current.run.researchLevels, ...persistedRun?.researchLevels };
        return {
          ...current,
          run: {
            ...current.run,
            ...persistedRun,
            // `|| DEFAULT_SUBJECT` (not `??`) also backfills a run persisted before subject
            // became non-nullable, whose stored value is `null` rather than merely absent.
            meta: {
              ...current.run.meta,
              ...persistedRun?.meta,
              subject: persistedRun?.meta?.subject || DEFAULT_SUBJECT,
              // Backfills a run persisted before unlocked-subject tracking existed.
              unlockedSubjects: persistedRun?.meta?.unlockedSubjects ?? [],
              // Backfills both a run persisted before per-class levels existed (no `classLevels`
              // key at all) and one persisted with the older single `characterClassLevel` number
              // (harmless leftover key, just no longer read anywhere).
              classLevels: { ...current.run.meta.classLevels, ...persistedRun?.meta?.classLevels },
              // Always re-derived from the tree total minus points already spent, rather than
              // trusted from the save file — points are no longer earned via a purchase button
              // (see ResearchScreen), so a save from before that removal could otherwise be
              // stuck at whatever low balance it last had.
              researchPoints: TOTAL_RESEARCH_POINTS - Object.values(researchLevels).reduce((sum, l) => sum + l, 0),
            },
            // An older save's `stats` were totals typed by hand, not adjustments — dropped, not reused.
            statAdjustments: { ...current.run.statAdjustments, ...persistedRun?.statAdjustments },
            researchLevels,
            // Backfill for a run persisted before magic level/talent tracking existed
            // (no `magicLevels`/`magicTalents` key at all).
            magicLevels: { ...current.run.magicLevels, ...persistedRun?.magicLevels },
            magicTalents: { ...current.run.magicTalents, ...persistedRun?.magicTalents },
          },
        };
      },
    }
  )
);
