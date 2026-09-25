import { formatUnits, parseUnits } from "viem";

/** Decimals of the underlying token (MockIDRX) and the vault shares. */
export const TOKEN_DECIMALS = 18;

/** bigint token amount -> JS number for display only (never for tx amounts). */
export function toDisplayNumber(amount: bigint | undefined): number {
  return Number(formatUnits(amount ?? 0n, TOKEN_DECIMALS));
}

/** Exact decimal string -> bigint token amount. Returns 0n for empty/invalid input. */
export function parseTokenAmount(input: string): bigint {
  const value = input.trim();
  if (!/^\d*\.?\d*$/.test(value) || value === "" || value === ".") return 0n;
  const [whole, frac = ""] = value.split(".");
  return parseUnits(`${whole || "0"}.${frac.slice(0, TOKEN_DECIMALS)}`, TOKEN_DECIMALS);
}

/** bigint token amount -> exact decimal string (for "max" buttons / inputs). */
export function formatTokenAmount(amount: bigint | undefined): string {
  return formatUnits(amount ?? 0n, TOKEN_DECIMALS);
}

export function formatIDRX(amount: bigint | number | string): string {
  const num = typeof amount === "bigint" ? toDisplayNumber(amount) : Number(amount);
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
  if (seconds <= 0) return "Not set";
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
  const days = Math.round(seconds / 86400);
  return days >= 60 ? `${Math.round(days / 30)} months` : `${days} days`;
}

export function basisPointsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function stateLabel(state: number): string {
  const labels: Record<number, string> = {
    0: "Open",
    1: "Locked",
    2: "Matured",
    3: "Approved for payout",
    4: "Closed",
  };
  return labels[state] ?? "Unknown";
}

/** Green where the user can act; amber where the round waits on another role. */
export function stateTone(state: number): string {
  const tones: Record<number, string> = {
    0: "bg-mint text-forest-deep",
    1: "bg-amber-soft text-amber",
    2: "bg-amber-soft text-amber",
    3: "bg-mint-2 text-forest-deep",
    4: "bg-white text-muted-foreground ring-1 ring-line-strong",
  };
  return tones[state] ?? "bg-mist text-muted-foreground";
}
