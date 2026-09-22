/** The small "Remove" text button at the bottom of a magic's, passive's, special's or artifact's modal (only for what the player added). */
export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-1 bg-transparent border-none p-0 text-[0.8rem] text-[#f0603c] cursor-pointer">
      {label}
    </button>
  );
}
