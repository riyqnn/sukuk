"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { ADDRESSES, CONTRACTS } from "@/contracts/addresses";
import { IDRX_ABI, SAFE_ABI, SUKUK_VAULT_ABI } from "@/contracts/abis";
import { sepolia } from "wagmi/chains";
import { useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Mined writes                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Like wagmi's `writeContractAsync`, but resolves only once the transaction is
 * mined, and rejects if it reverted. Needed so `approve` -> `deposit` sequences
 * do not race the allowance, and so the UI never reports "confirmed" early.
 */
function useMinedWrite() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const queryClient = useQueryClient();
  const write = useCallback(
    async (...args: Parameters<typeof writeContractAsync>): Promise<`0x${string}`> => {
      const hash = await writeContractAsync(...args);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      if (receipt?.status === "reverted") throw new Error("Transaction reverted on-chain.");
      await queryClient.invalidateQueries(); // refresh every on-chain read
      return hash;
    },
    [writeContractAsync, publicClient, queryClient],
  );
  return { writeContractAsync: write };
}

/* -------------------------------------------------------------------------- */
/*  IDRX                                                                      */
/* -------------------------------------------------------------------------- */

export function useIDRXBalance(address?: `0x${string}`) {
  const result = useReadContract({
    address: CONTRACTS.idrx,
    abi: IDRX_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useIDRXAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  const result = useReadContract({
    address: CONTRACTS.idrx,
    abi: IDRX_ABI,
    functionName: "allowance",
    args: owner && spender ? [owner, spender] : undefined,
    query: { enabled: !!owner && !!spender },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as bigint | undefined };
}

/* -------------------------------------------------------------------------- */
/*  Sukuk Vault, reads                                                       */
/* -------------------------------------------------------------------------- */

export function useVaultState() {
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "state",
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as number | undefined };
}

export function useVaultParameters() {
  const maxQuota = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "maxQuota", chainId: sepolia.id });
  const duration = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "duration", chainId: sepolia.id });
  const apy = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "apy", chainId: sepolia.id });
  const lockStartTime = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "lockStartTime", chainId: sepolia.id });
  const vaultCreated = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "vaultCreated", chainId: sepolia.id });
  return {
    maxQuota: { ...maxQuota, data: maxQuota.data as bigint | undefined },
    duration: { ...duration, data: duration.data as bigint | undefined },
    apy: { ...apy, data: apy.data as bigint | undefined },
    lockStartTime: { ...lockStartTime, data: lockStartTime.data as bigint | undefined },
    vaultCreated: { ...vaultCreated, data: vaultCreated.data as boolean | undefined },
  };
}

export function useVaultTotals() {
  const totalAssets = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "totalAssets", chainId: sepolia.id });
  const totalSupply = useReadContract({ address: CONTRACTS.sukukVault, abi: SUKUK_VAULT_ABI, functionName: "totalSupply", chainId: sepolia.id });
  return {
    totalAssets: { ...totalAssets, data: totalAssets.data as bigint | undefined },
    totalSupply: { ...totalSupply, data: totalSupply.data as bigint | undefined },
  };
}

export function useSukukBalance(address?: `0x${string}`) {
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useConvertToAssets(shares?: bigint) {
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "convertToAssets",
    args: shares !== undefined ? [shares] : undefined,
    query: { enabled: shares !== undefined },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useMaxRedeem(address?: `0x${string}`) {
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "maxRedeem",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as bigint | undefined };
}

export function useHasRole(role: "PROTOCOL_ROLE" | "AUDITOR_ROLE", account?: `0x${string}`) {
  const roleHash = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: role,
    chainId: sepolia.id,
  });
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "hasRole",
    args: roleHash.data && account ? [roleHash.data as `0x${string}`, account] : undefined,
    query: { enabled: !!roleHash.data && !!account },
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as boolean | undefined };
}

export function useVaultPaused() {
  const result = useReadContract({
    address: CONTRACTS.sukukVault,
    abi: SUKUK_VAULT_ABI,
    functionName: "paused",
    chainId: sepolia.id,
  });
  return { ...result, data: result.data as boolean | undefined };
}

/**
 * Owners and signature threshold read from the auditor Safe itself, so the UI never
 * states a policy the Safe does not enforce.
 */
export function useSafePolicy() {
  const threshold = useReadContract({
    address: ADDRESSES.auditorMultisig,
    abi: SAFE_ABI,
    functionName: "getThreshold",
    chainId: sepolia.id,
  });
  const owners = useReadContract({
    address: ADDRESSES.auditorMultisig,
    abi: SAFE_ABI,
    functionName: "getOwners",
    chainId: sepolia.id,
  });
  return {
    threshold: threshold.data as bigint | undefined,
    owners: owners.data as readonly `0x${string}`[] | undefined,
    isLoading: threshold.isLoading || owners.isLoading,
    isError: threshold.isError || owners.isError,
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes, Investor actions                                                  */
/* -------------------------------------------------------------------------- */

export function useApproveIDRX() {
  const { writeContractAsync } = useMinedWrite();
  return {
    approve: (spender: `0x${string}`, amount: bigint) =>
      writeContractAsync({
        address: CONTRACTS.idrx,
        abi: IDRX_ABI,
        functionName: "approve",
        args: [spender, amount],
        chainId: sepolia.id,
      }),
  };
}

export function useSukukDeposit() {
  const { writeContractAsync } = useMinedWrite();
  return {
    deposit: (assets: bigint, receiver: `0x${string}`) =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "deposit",
        args: [assets, receiver],
        chainId: sepolia.id,
      }),
  };
}

export function useSukukRedeem() {
  const { writeContractAsync } = useMinedWrite();
  return {
    redeem: (shares: bigint, receiver: `0x${string}`, owner: `0x${string}`) =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "redeem",
        args: [shares, receiver, owner],
        chainId: sepolia.id,
      }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes, Admin (PROTOCOL_ROLE) actions                                     */
/* -------------------------------------------------------------------------- */

/** Step 1: createVault(maxQuota, duration, apy) */
export function useCreateVault() {
  const { writeContractAsync } = useMinedWrite();
  return {
    createVault: (maxQuota: bigint, duration: bigint, apy: bigint) =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "createVault",
        args: [maxQuota, duration, apy],
        chainId: sepolia.id,
      }),
  };
}

/** Step 3: protocolFill(amount) */
export function useProtocolFill() {
  const { writeContractAsync } = useMinedWrite();
  return {
    protocolFill: (amount: bigint) =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "protocolFill",
        args: [amount],
        chainId: sepolia.id,
      }),
  };
}

/** Step 5: sendPayout(totalPayoutAmount) */
export function useSendPayout() {
  const { writeContractAsync } = useMinedWrite();
  return {
    sendPayout: (totalPayoutAmount: bigint) =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "sendPayout",
        args: [totalPayoutAmount],
        chainId: sepolia.id,
      }),
  };
}

/** Close vault */
export function useCloseVault() {
  const { writeContractAsync } = useMinedWrite();
  return {
    closeVault: () =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "closeVault",
        args: [],
        chainId: sepolia.id,
      }),
  };
}

/** Pause / Unpause */
export function usePauseVault() {
  const { writeContractAsync } = useMinedWrite();
  return {
    pause: () =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "pause",
        args: [],
        chainId: sepolia.id,
      }),
    unpause: () =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "unpause",
        args: [],
        chainId: sepolia.id,
      }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes, Auditor (AUDITOR_ROLE) actions                                    */
/* -------------------------------------------------------------------------- */

/** Step 4: approveVault() */
export function useApproveVault() {
  const { writeContractAsync } = useMinedWrite();
  return {
    approveVault: () =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "approveVault",
        args: [],
        chainId: sepolia.id,
      }),
  };
}

/** Step 6: approvePayout() */
export function useApprovePayout() {
  const { writeContractAsync } = useMinedWrite();
  return {
    approvePayout: () =>
      writeContractAsync({
        address: CONTRACTS.sukukVault,
        abi: SUKUK_VAULT_ABI,
        functionName: "approvePayout",
        args: [],
        chainId: sepolia.id,
      }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Writes, IDRX faucet (testnet only)                                        */
/* -------------------------------------------------------------------------- */

export function useIDRXMint() {
  const { writeContractAsync } = useMinedWrite();
  return {
    mint: (to: `0x${string}`, amount: bigint) =>
      writeContractAsync({
        address: CONTRACTS.idrx,
        abi: IDRX_ABI,
        functionName: "mint",
        args: [to, amount],
        chainId: sepolia.id,
      }),
  };
}

/* -------------------------------------------------------------------------- */
/*  Transaction lifecycle helper                                               */
/* -------------------------------------------------------------------------- */

export type TxStatus = "idle" | "approving" | "awaiting_signature" | "pending" | "confirmed" | "failed";

export function useTxState() {
  const [status, setStatus] = useState<TxStatus>("idle");
  const [hash, setHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  return {
    status,
    setStatus,
    hash,
    setHash,
    error,
    setError,
    reset: () => { setStatus("idle"); setHash(""); setError(""); },
  };
}