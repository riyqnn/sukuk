"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, ExternalLink, RefreshCw } from "lucide-react";
import { ADDRESSES } from "@/contracts/addresses";
import { useSafePolicy, useVaultParameters, useVaultState, useVaultTotals } from "@/lib/contracts";
import {
  fetchPendingSafeTransactions,
  fetchSafeInfo,
  getErrorMessage,
  getEvmProvider,
  proposeSafeTransaction,
  type SafeInfo,
  type SafePendingTransaction,
} from "@/lib/safe";
import { compactAddress, formatIDRX, toDisplayNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/PageHeader";
import { KeyFigures } from "@/components/ui/KeyFigures";
import { Panel } from "@/components/ui/Panel";
import { StepAction } from "@/components/ui/StepAction";
import { StateBadge } from "@/components/ui/StateBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { AnimatedNumber, EASE, PageTransition, Press, Reveal } from "@/components/ui/motion";

export default function AuditorPage() {
  const { address, isConnected } = useAccount();
  const { data: vaultStateRaw, isLoading: stateLoading, refetch: refetchState } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();
  const safePolicy = useSafePolicy();

  const [loadingStep, setLoadingStep] = useState<"vault" | "payout" | null>(null);
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingTxs, setPendingTxs] = useState<SafePendingTransaction[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [hasLoadedQueue, setHasLoadedQueue] = useState(false);

  const s = Number(vaultStateRaw ?? 0);
  const maxQuota = toDisplayNumber(params.maxQuota.data);
  const totalAssets = toDisplayNumber(totals.totalAssets.data);
  const totalSupply = toDisplayNumber(totals.totalSupply.data);
  const filledPct = maxQuota > 0 ? (totalAssets / maxQuota) * 100 : 0;
  const exchangeRate = totalSupply > 0 ? totalAssets / totalSupply : 1;
  const safeQueueUrl = `https://app.safe.global/transactions/queue?safe=sep:${ADDRESSES.auditorMultisig}`;
  const threshold = safePolicy.threshold !== undefined ? Number(safePolicy.threshold) : safeInfo?.threshold;
  const policy =
    safePolicy.threshold !== undefined && safePolicy.owners
      ? `${safePolicy.threshold}-of-${safePolicy.owners.length}`
      : null;

  const canLock = s === 0 && !!params.vaultCreated.data && totalSupply > 0;
  const canRelease = s === 2;

  async function loadQueue() {
    setLoadingPending(true);
    const [pending, info] = await Promise.all([fetchPendingSafeTransactions(), fetchSafeInfo()]);
    setPendingTxs(pending);
    setSafeInfo(info);
    setHasLoadedQueue(true);
    setLoadingPending(false);
  }

  async function handlePropose(functionName: "approveVault" | "approvePayout") {
    if (!address) {
      setErrorMsg("Connect a wallet that owns the Safe first.");
      return;
    }
    const provider = getEvmProvider();
    if (!provider) {
      setErrorMsg("No browser wallet was detected.");
      return;
    }
    try {
      setLoadingStep(functionName === "approveVault" ? "vault" : "payout");
      setErrorMsg("");
      setTxHash("");
      await provider.request({ method: "eth_requestAccounts" });
      const res = await proposeSafeTransaction({ functionName, provider, signerAddress: address });
      setTxHash(res.safeTxHash);
      await loadQueue();
      refetchState();
    } catch (e: unknown) {
      console.error("Safe SDK error:", e);
      setErrorMsg(getErrorMessage(e));
    } finally {
      setLoadingStep(null);
    }
  }

  const proposeButton = (fn: "approveVault" | "approvePayout", ready: boolean) =>
    !isConnected ? (
      <WalletConnect />
    ) : (
      <Press className="w-full">
        <button
          type="button"
          onClick={() => handlePropose(fn)}
          disabled={!ready || loadingStep !== null}
          className="btn btn-primary w-full"
        >
          {loadingStep === (fn === "approveVault" ? "vault" : "payout") ? "Signing the Safe proposal…" : `Propose ${fn}()`}
        </button>
      </Press>
    );

  return (
    <PageTransition>
      <div className="container pb-24">
        <PageHeader
          kicker="Auditor portal"
          title="The two gates the Safe controls"
          description="Proposals are signed here and sent to the Safe Transaction Service. They execute once enough Safe owners confirm them."
          aside={
            <div className="flex flex-wrap items-center gap-3 text-[13px]">
              <span className="chip bg-pistachio text-forest-deep">
                {safePolicy.isLoading ? "Reading policy…" : policy ? `${policy} signatures` : "Policy unavailable"}
              </span>
              <a
                href={`https://app.safe.global/home?safe=sep:${ADDRESSES.auditorMultisig}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-muted-foreground hover:text-forest"
              >
                {compactAddress(ADDRESSES.auditorMultisig)} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          }
          actions={
            <Press>
              <a href={safeQueueUrl} target="_blank" rel="noreferrer" className="btn btn-ghost">
                Open Safe queue
                <span className="btn-icon">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
            </Press>
          }
        />

        <Reveal delay={0.05}>
          <KeyFigures
            figures={[
              {
                label: "Vault state",
                lead: true,
                value: stateLoading ? <Skeleton className="h-6 w-28" /> : <StateBadge state={s} />,
                note: canLock ? "Ready for approveVault()" : canRelease ? "Ready for approvePayout()" : "No gate is open for the Safe",
              },
              { label: "Subscribed", value: <AnimatedNumber value={totalAssets} suffix=" IDRX" />, note: `${filledPct.toFixed(1)}% of the quota` },
              { label: "Shares issued", value: <AnimatedNumber value={totalSupply} />, note: "approveVault() needs at least one" },
              { label: "Share price", value: exchangeRate.toFixed(4), note: "IDRX per sSUKUK" },
            ]}
          />
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <StepAction
            step="04"
            title="Lock the round"
            call="approveVault()"
            description="Closes subscription and locks the deposited IDRX until maturity. Moves the vault from Open to Locked."
            requires="Open"
            current={s}
            ready={canLock}
            checks={[
              { label: "Round configured", ok: !!params.vaultCreated.data },
              { label: "Vault is Open", ok: s === 0 },
              { label: `Shares issued (${formatIDRX(totalSupply)})`, ok: totalSupply > 0 },
            ]}
            delay={0.05}
          >
            {proposeButton("approveVault", canLock)}
          </StepAction>

          <StepAction
            step="06"
            title="Release the payout"
            call="approvePayout()"
            description="Confirms the funded payout and opens redemption for every holder. Moves the vault from Matured to Approved for payout."
            requires="Matured"
            current={s}
            ready={canRelease}
            checks={[
              { label: "Vault is Matured", ok: s === 2 },
              { label: `Assets in vault (${formatIDRX(totalAssets)} IDRX)`, ok: totalAssets > 0 },
              { label: `Share price at or above 1 (${exchangeRate.toFixed(4)})`, ok: exchangeRate >= 1 },
            ]}
            delay={0.1}
          >
            {proposeButton("approvePayout", canRelease)}
          </StepAction>
        </div>

        <AnimatePresence>
          {(txHash || errorMsg) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
              role="status"
              className={`mt-8 rounded-[24px] px-7 py-6 ${txHash ? "bg-mint text-forest-deep" : "bg-danger-soft text-danger"}`}
            >
              {txHash ? (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-semibold">
                      <Check className="h-4 w-4" aria-hidden="true" /> Proposal signed and sent to the Safe
                    </p>
                    <p className="mt-1 text-[13px]">
                      It executes after {threshold ?? "the required number of"} owner
                      {threshold === 1 ? "" : "s"} confirm it in the Safe queue.
                    </p>
                    <p className="mt-2 break-all font-mono text-xs">Safe tx {txHash}</p>
                  </div>
                  <a href={safeQueueUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm shrink-0">
                    Confirm in Safe <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold">The proposal was not sent</p>
                    <p className="mt-1 break-words font-mono text-xs">{errorMsg}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Panel
          title="Pending in the Safe queue"
          description="Proposals waiting for owner confirmations."
          className="mt-8"
          bodyClassName="p-0"
          delay={0.05}
          action={
            <button type="button" onClick={loadQueue} disabled={loadingPending} className="btn btn-soft btn-sm">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingPending ? "animate-spin" : ""}`} aria-hidden="true" />
              {loadingPending ? "Loading…" : hasLoadedQueue ? "Reload" : "Load queue"}
            </button>
          }
        >
          {!hasLoadedQueue ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">
              The queue is fetched from the Safe Transaction Service when you ask for it.
            </p>
          ) : pendingTxs.length === 0 ? (
            <p className="px-6 py-10 text-center text-[13px] text-muted-foreground">Nothing is waiting for signatures.</p>
          ) : (
            <ul className="hairline">
              {pendingTxs.map((tx) => {
                const confirmed = tx.confirmations?.length ?? 0;
                const need = threshold ?? confirmed;
                return (
                  <li key={tx.safeTxHash} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] font-medium">{compactAddress(tx.safeTxHash)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-mint">
                          <div className="h-full rounded-full bg-forest" style={{ width: `${need > 0 ? Math.min(100, (confirmed / need) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {confirmed} of {need} confirmations
                        </span>
                      </div>
                    </div>
                    <a href={safeQueueUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                      Review in Safe <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </PageTransition>
  );
}
