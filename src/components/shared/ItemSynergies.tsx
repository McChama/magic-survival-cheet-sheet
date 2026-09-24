import { getOwnedFlags, getSynergiesForItem } from "../../data/synergies";
import { useRunStore } from "../../store/useRunStore";
import { useGameDataText } from "../../i18n/useGameDataText";
import { SynergyBadge } from "./SynergyBadge";

/**
 * The Synergies an artifact or passive is one of the requirements of — one round medallion each, with its progress ring
 * (a gold segment per required item the run owns). Renders nothing for an item no Synergy asks for.
 */
export function ItemSynergies({ itemId }: { itemId: string }) {
  const run = useRunStore((s) => s.run);
  const gt = useGameDataText();
  const synergies = getSynergiesForItem(itemId);
  if (synergies.length === 0) return null;
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap mt-3">
      {synergies.map((synergy) => {
        const name = gt(`synergy.${synergy.id}.name`, synergy.name);
        return (
          <span key={synergy.id} title={name} className="w-11 flex-none">
            <SynergyBadge image={synergy.image} alt={name} owned={getOwnedFlags(synergy, run)} />
          </span>
        );
      })}
    </div>
  );
}
