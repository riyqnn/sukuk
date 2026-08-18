import { stateColor, stateLabel } from "@/lib/formatters";

export function StateBadge({ state }: { state: number }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${stateColor(state)}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {stateLabel(state)}
    </span>
  );
}