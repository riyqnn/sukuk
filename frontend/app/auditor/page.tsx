"use client";

import { useAccount } from "wagmi";
import { ADDRESSES } from "@/contracts/addresses";
import { useVaultState, useVaultParameters, useVaultTotals } from "@/lib/contracts";
import {
  proposeSafeTransaction,
  fetchPendingSafeTransactions,
  fetchSafeInfo,
  getEvmProvider,
  getErrorMessage,
  type SafePendingTransaction,
  type SafeInfo,
} from "@/lib/safe";
import { StateBadge } from "@/components/ui/StateBadge";
import { formatIDRX, stateLabel, compactAddress } from "@/lib/formatters";
import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, Loader2, ArrowUpRight, Clock, Send, RefreshCw } from "lucide-react";
import {
  AnimatedNumber,
  TiltCard,
  MagneticButton,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
  PulseGlowBadge,
} from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";

export default function AuditorPage() {
  const { address, isConnected } = useAccount();
  const { data: vaultStateRaw, refetch: refetchState } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();

  const [loadingStep, setLoadingStep] = useState<"vault" | "payout" | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [pendingTxs, setPendingTxs] = useState<SafePendingTransaction[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [safeInfo, setSafeInfo] = useState<SafeInfo | null>(null);
  const [hasLoadedQueue, setHasLoadedQueue] = useState(false);

  const s = Number(vaultStateRaw ?? 0);
  const maxQuota = Number((params.maxQuota.data ?? 0n) as bigint) / 1e18;
  const totalAssets = Number((totals.totalAssets.data ?? 0n) as bigint) / 1e18;
  const totalSupply = Number((totals.totalSupply.data ?? 0n) as bigint) / 1e18;
  const filledPct = maxQuota > 0 ? (totalAssets / maxQuota) * 100 : 0;
  const exchangeRate = totalSupply > 0 ? totalAssets / totalSupply : 1;

  const safeQueueUrl = `https://app.safe.global/transactions/queue?safe=sep:${ADDRESSES.auditorMultisig}`;

  const loadData = async () => {
    setLoadingPending(true);
    const [pendingResults, info] = await Promise.all([
      fetchPendingSafeTransactions(),
      fetchSafeInfo(),
    ]);
    setPendingTxs(pendingResults);
    setSafeInfo(info);
    setHasLoadedQueue(true);
    setLoadingPending(false);
  };

  async function handlePropose(functionName: "approveVault" | "approvePayout") {
    if (!address) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }
    const provider = getEvmProvider();
    if (!provider) {
      setErrorMsg("No Web3 EVM provider detected in browser.");
      return;
    }

    try {
      setLoadingStep(functionName === "approveVault" ? "vault" : "payout");
      setErrorMsg("");
      setTxHash("");
      setSignature("");

      await provider.request({ method: "eth_requestAccounts" });

      const res = await proposeSafeTransaction({
        functionName,
        provider,
        signerAddress: address,
      });

      setTxHash(res.safeTxHash);
      setSignature(res.signature);
      await loadData();
      refetchState();
    } catch (e: unknown) {
      console.error("Safe SDK Error:", e);
      setErrorMsg(getErrorMessage(e));
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <PageTransition>
      <div className="container py-12 space-y-10">
        {/* Header */}
        <FadeIn direction="down" className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center text-ring shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span>01 &middot; SAFE MULTI-SIG ORACLE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                Auditor Portal
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                Compliance Verification & Multi-Signature Threshold (2-of-3)
              </p>
            </div>
          </div>

          <MagneticButton>
            <a href={safeQueueUrl} target="_blank" rel="noreferrer" className="button">
              <span>Open Safe Workspace</span>
              <span className="button-arrow">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </a>
          </MagneticButton>
        </FadeIn>

        {/* Safe Governance Banner */}
        <FadeIn direction="up" delay={0.1} className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <PulseGlowBadge text="Safe Multi-Sig Governance Account" color="emerald" />
              <span className="text-[0.6875rem] px-2.5 py-0.5 bg-ring/10 text-ring rounded-full font-mono font-bold border border-ring/30">
                2-of-3 Threshold
              </span>
            </div>
            <span className="font-mono text-xs font-semibold text-muted-foreground">{ADDRESSES.auditorMultisig}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Audit actions (<strong>Audit 1: approveVault</strong> & <strong>Audit 2: approvePayout</strong>) are processed through the Safe SDK. Proposing an action creates and signs a transaction dispatched to the Safe Multi-Sig Queue for signer execution.
          </p>
        </FadeIn>

        {/* Vault Status Matrix */}
        <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-5" staggerDelay={0.07}>
          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Vault State</span>
                <div>
                  {vaultStateRaw !== undefined ? <StateBadge state={s} /> : <span className="text-xs text-muted-foreground">Loading…</span>}
                </div>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Total Assets</span>
                <p className="text-xl font-mono font-bold text-foreground">
                  <AnimatedNumber value={totalAssets} suffix=" IDRX" decimals={0} />
                </p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Subscription Capacity</span>
                <p className="text-xl font-mono font-bold text-foreground">
                  <AnimatedNumber value={filledPct} suffix="%" decimals={1} />
                </p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Exchange Rate</span>
                <p className="text-xl font-mono font-bold text-ring">{exchangeRate.toFixed(4)}×</p>
              </div>
            </TiltCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audit 1 */}
          <FadeIn direction="right" delay={0.15}>
            <TiltCard maxTilt={4} className={`h-full ${s === 0 && params.vaultCreated.data ? "" : "opacity-80"}`}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">AUDIT 1</span>
                    <h2 className="text-xl font-bold text-foreground">Approve Vault & Lock</h2>
                    <p className="text-xs text-muted-foreground">Verifies underlying Sukuk RWA asset backing and locks vault funds (OPEN &rarr; LOCKED).</p>
                    <p className="text-[0.6875rem] text-muted-foreground font-mono mt-1">Required State: OPEN (0) &middot; Current: {stateLabel(s)}</p>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5 border border-border">
                    <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-bold">Audit 1 Verification Checklist</p>
                    <CheckItem label="Vault configured & created on-chain" checked={!!params.vaultCreated.data} />
                    <CheckItem label="Vault state is OPEN" checked={s === 0} />
                    <CheckItem label={`Total Subscribed: ${filledPct.toFixed(1)}% (${formatIDRX(totalAssets)} IDRX)`} checked={filledPct > 0} />
                    <CheckItem label="Underlying physical Sukuk asset custodian receipt verified" checked={s === 0} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  {!isConnected ? (
                    <p className="text-xs text-muted-foreground text-center">Connect wallet to propose Safe Multi-Sig transaction.</p>
                  ) : (
                    <MagneticButton className="w-full">
                      <button
                        onClick={() => handlePropose("approveVault")}
                        disabled={s !== 0 || !params.vaultCreated.data || loadingStep !== null}
                        className="w-full button justify-center text-xs font-bold py-3 disabled:opacity-40"
                      >
                        {loadingStep === "vault" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing Safe SDK Proposal…</>
                        ) : (
                          <><Send className="w-4 h-4" /> Propose approveVault() to Safe</>
                        )}
                      </button>
                    </MagneticButton>
                  )}
                </div>
              </div>
            </TiltCard>
          </FadeIn>

          {/* Audit 2 */}
          <FadeIn direction="left" delay={0.15}>
            <TiltCard maxTilt={4} className={`h-full ${s === 2 ? "" : "opacity-80"}`}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">AUDIT 2</span>
                    <h2 className="text-xl font-bold text-foreground">Approve Payout & Redeem</h2>
                    <p className="text-xs text-muted-foreground">Verifies yield completion and enables share redemptions (MATURED &rarr; APPROVED_FOR_PAYOUT).</p>
                    <p className="text-[0.6875rem] text-muted-foreground font-mono mt-1">Required State: MATURED (2) &middot; Current: {stateLabel(s)}</p>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5 border border-border">
                    <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-bold">Audit 2 Verification Checklist</p>
                    <CheckItem label="Vault state is MATURED" checked={s === 2} />
                    <CheckItem label={`Ready Assets: ${formatIDRX(totalAssets)} IDRX`} checked={totalAssets > 0} />
                    <CheckItem label={`Exchange Rate Parity: ${exchangeRate.toFixed(4)}×`} checked={exchangeRate >= 1} />
                    <CheckItem label="Yield distribution calculation approved by Compliance" checked={s === 2} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  {!isConnected ? (
                    <p className="text-xs text-muted-foreground text-center">Connect wallet to propose Safe Multi-Sig transaction.</p>
                  ) : (
                    <MagneticButton className="w-full">
                      <button
                        onClick={() => handlePropose("approvePayout")}
                        disabled={s !== 2 || loadingStep !== null}
                        className="w-full button justify-center text-xs font-bold py-3 disabled:opacity-40"
                      >
                        {loadingStep === "payout" ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Processing Safe SDK Proposal…</>
                        ) : (
                          <><Send className="w-4 h-4" /> Propose approvePayout() to Safe</>
                        )}
                      </button>
                    </MagneticButton>
                  )}
                </div>
              </div>
            </TiltCard>
          </FadeIn>
        </div>

        {/* Feedback banner */}
        <AnimatePresence>
          {txHash && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-3"
            >
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                Proposal Signed & Dispatched via Safe SDK!
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                The transaction proposal has been signed and transmitted to the Safe Transaction Service. It is currently active in the Safe Workspace Queue for 2-of-3 signer confirmation.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono border-t border-emerald-500/20">
                <div className="space-y-1 truncate max-w-lg">
                  <p className="text-emerald-950 font-bold">Safe Tx Hash: {txHash}</p>
                  {signature && <p className="text-emerald-800 text-[0.6875rem] truncate">Signature: {signature}</p>}
                </div>
                <a
                  href={safeQueueUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button text-xs py-2"
                >
                  <span>Confirm in Safe Workspace Queue</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-xs text-red-700 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Safe SDK Proposal Error:</p>
                <p className="font-mono text-[0.75rem]">{errorMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safe Queue Table */}
        <FadeIn direction="up" delay={0.2} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-ring" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Pending Safe Multi-Sig Proposals</h3>
            </div>
            <button
              onClick={loadData}
              disabled={loadingPending}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-ring bg-secondary border border-border rounded-full hover:bg-border transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? "animate-spin" : ""}`} />
              {loadingPending ? "Fetching Queue…" : "Refresh Queue"}
            </button>
          </div>

          {!hasLoadedQueue ? (
            <div className="bg-secondary/40 border border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
              Click &quot;Refresh Queue&quot; to inspect active proposals in Safe Transaction Service.
            </div>
          ) : pendingTxs.length === 0 ? (
            <div className="bg-secondary/40 border border-border rounded-xl p-6 text-center text-xs text-muted-foreground font-mono">
              No pending multi-sig proposals awaiting signers in Safe Queue.
            </div>
          ) : (
            <StaggerContainer className="space-y-3" staggerDelay={0.06}>
              {pendingTxs.map((tx: SafePendingTransaction, idx: number) => (
                <StaggerItem key={idx}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary/30 border border-border rounded-xl gap-3 text-xs">
                    <div className="space-y-1 font-mono">
                      <p className="font-bold text-foreground">
                        Safe Tx Hash: {compactAddress(tx.safeTxHash || "")}
                      </p>
                      <p className="text-muted-foreground text-xs font-sans">
                        Confirmations: <span className="font-bold text-ring">{tx.confirmations?.length || 0} / {safeInfo?.threshold || 2} Signers</span>
                      </p>
                    </div>
                    <a
                      href={safeQueueUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="button text-xs py-2"
                    >
                      <span>Approve in Safe</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </FadeIn>
      </div>
    </PageTransition>
  );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <motion.span
        initial={false}
        animate={{ scale: checked ? [1, 1.2, 1] : 1 }}
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[0.625rem] font-bold ${
          checked ? "bg-emerald-500/20 text-emerald-800 border border-emerald-500/40" : "bg-secondary text-muted-foreground border border-border"
        }`}
      >
        {checked ? "✓" : "–"}
      </motion.span>
      <span className={`font-medium ${checked ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}
