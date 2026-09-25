"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { sepolia } from "wagmi/chains";
import { CONTRACTS, VAULT_DEPLOY_BLOCK } from "@/contracts/addresses";
import { SUKUK_VAULT_ABI } from "@/contracts/abis";

export type ActivityKind =
  | "VaultCreated"
  | "Deposited"
  | "ProtocolFilled"
  | "VaultLocked"
  | "PayoutFunded"
  | "PayoutApproved"
  | "Redeemed"
  | "VaultClosed"
  | "Paused"
  | "Unpaused";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: number; // unix seconds
  account?: `0x${string}`; // investor / actor the event is about
  amount?: bigint; // IDRX (assets) where applicable
  shares?: bigint;
}

const KINDS: readonly string[] = [
  "VaultCreated",
  "Deposited",
  "ProtocolFilled",
  "VaultLocked",
  "PayoutFunded",
  "PayoutApproved",
  "Redeemed",
  "VaultClosed",
  "Paused",
  "Unpaused",
];

const LOG_RANGE = 50_000n; // stay under public-RPC getLogs limits
const ACTIVITY_KEY = ["vault-activity", CONTRACTS.sukukVault] as const;

type Args = Record<string, unknown>;

function toItem(
  log: { eventName?: string; args?: unknown; transactionHash: `0x${string}`; blockNumber: bigint; logIndex: number },
  timestamps: Map<bigint, number>,
): ActivityItem | null {
  const kind = log.eventName;
  if (!kind || !KINDS.includes(kind)) return null;
  const a = (log.args ?? {}) as Args;
  const base = {
    id: `${log.transactionHash}-${log.logIndex}`,
    kind: kind as ActivityKind,
    txHash: log.transactionHash,
    blockNumber: log.blockNumber,
    timestamp: timestamps.get(log.blockNumber) ?? 0,
  };
  switch (kind) {
    case "Deposited":
    case "ProtocolFilled":
      return { ...base, account: a.receiver as `0x${string}`, amount: a.assets as bigint, shares: a.shares as bigint };
    case "Redeemed":
      return { ...base, account: a.owner as `0x${string}`, amount: a.assets as bigint, shares: a.shares as bigint };
    case "PayoutFunded":
      return { ...base, amount: a.totalPayoutAmount as bigint };
    case "VaultCreated":
      return { ...base, amount: a.maxQuota as bigint };
    case "Paused":
    case "Unpaused":
      return { ...base, account: a.account as `0x${string}` };
    default:
      return base;
  }
}

/** Every vault lifecycle/financial event, newest first, read straight from Sepolia logs. */
export function useVaultActivity() {
  const client = usePublicClient({ chainId: sepolia.id });
  const queryClient = useQueryClient();

  // New event on the vault -> refetch immediately (plus a slow poll as a fallback).
  useWatchContractEvent({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    chainId: sepolia.id,
    onLogs: () => queryClient.invalidateQueries({ queryKey: ACTIVITY_KEY }),
  });

  return useQuery({
    queryKey: ACTIVITY_KEY,
    enabled: !!client,
    refetchInterval: 30_000,
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!client) return [];
      const latest = await client.getBlockNumber();
      const logs = [];
      for (let from = VAULT_DEPLOY_BLOCK; from <= latest; from += LOG_RANGE) {
        const to = from + LOG_RANGE - 1n < latest ? from + LOG_RANGE - 1n : latest;
        logs.push(
          ...(await client.getContractEvents({
            address: CONTRACTS.sukukVault,
            abi: SUKUK_VAULT_ABI,
            fromBlock: from,
            toBlock: to,
          })),
        );
      }

      const blocks = [...new Set(logs.map((l) => l.blockNumber))];
      const timestamps = new Map<bigint, number>();
      await Promise.all(
        blocks.map(async (blockNumber) => {
          const block = await client.getBlock({ blockNumber });
          timestamps.set(blockNumber, Number(block.timestamp));
        }),
      );

      // protocolFill() emits both ProtocolFilled and Deposited; keep the more specific one.
      const filledTx = new Set(logs.filter((l) => l.eventName === "ProtocolFilled").map((l) => l.transactionHash));
      return logs
        .filter((l) => !(l.eventName === "Deposited" && filledTx.has(l.transactionHash)))
        .map((l) => toItem(l, timestamps))
        .filter((i): i is ActivityItem => i !== null)
        .sort((x, y) => (y.blockNumber === x.blockNumber ? 0 : y.blockNumber > x.blockNumber ? 1 : -1));
    },
  });
}
