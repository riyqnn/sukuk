"use client";

interface BarSegment {
  label: string;
  value: number;
  color?: string;
}

/**
 * Minimalist horizontal funding bar — Swiss editorial style.
 * Shows filled vs remaining capacity with precise typographic labels.
 */
export function FundingBar({
  filled,
  total,
  segments,
}: {
  filled: number;
  total: number;
  segments?: BarSegment[];
}) {
  if (total <= 0) return null;
  const pct = Math.min(100, (filled / total) * 100);

  return (
    <div className="space-y-3 bg-surface p-4 rounded-lg border">
      {/* Segmented bar */}
      <div className="relative h-2 w-full bg-divider rounded-full overflow-hidden">
        {segments ? (
          segments.map((s, i) => (
            <div
              key={i}
              className="absolute inset-y-0 transition-all duration-700"
              style={{
                left: `${segments.slice(0, i).reduce((a, b) => a + (b.value / total) * 100, 0)}%`,
                width: `${(s.value / total) * 100}%`,
                backgroundColor: s.color ?? "#047857",
              }}
            />
          ))
        ) : (
          <div
            className="h-full bg-emerald-700 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground uppercase tracking-wider font-semibold">Filled</span>
          <span className="font-mono font-semibold text-foreground">{pct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground uppercase tracking-wider font-semibold">Capacity</span>
          <span className="font-mono font-semibold text-foreground">{formatNum(total)} IDRX</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimalist vertical bar indicators — like a small financial data strip.
 * Single-row horizontal bars with labels.
 */
export function MiniBars({
  items,
}: {
  items: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="space-y-3 bg-surface p-4 rounded-lg border">
      {items.map((item, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-medium">{item.label}</span>
            <span className="font-mono font-semibold text-foreground">{formatNum(item.value)}</span>
          </div>
          <div className="h-1.5 bg-divider rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (item.value / item.max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}