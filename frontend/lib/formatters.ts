export function formatIDRX(amount: bigint | number | string): string {
  const num = typeof amount === "bigint" ? Number(amount) / 1e18 : Number(amount);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
}

export function compactAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  if (days >= 30) return `${Math.floor(days / 30)} MO`;
  return `${days} DAYS`;
}

export function basisPointsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function stateLabel(state: number): string {
  const labels: Record<number, string> = {
    0: "OPEN",
    1: "LOCKED",
    2: "MATURED",
    3: "APPROVED FOR PAYOUT",
    4: "CLOSED",
  };
  return labels[state] ?? "UNKNOWN";
}

export function stateColor(state: number): string {
  const colors: Record<number, string> = {
    0: "text-emerald-600",
    1: "text-amber-600",
    2: "text-sky-600",
    3: "text-emerald-700",
    4: "text-neutral-500",
  };
  return colors[state] ?? "text-neutral-500";
}