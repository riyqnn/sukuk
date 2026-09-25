import { stateLabel, stateTone } from "@/lib/formatters";

/** The vault's current lifecycle state, as read from the contract. */
export function StateBadge({ state }: { state: number }) {
  return (
    <span className={`chip ${stateTone(state)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {stateLabel(state)}
    </span>
  );
}
