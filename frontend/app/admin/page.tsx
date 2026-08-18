"use client";

import { useAccount } from "wagmi";
import { CONTRACTS, ADDRESSES } from "@/contracts/addresses";
import {
  useVaultState, useVaultParameters, useVaultTotals, useIDRXBalance,
  useCreateVault, useProtocolFill, useSendPayout, useCloseVault,
  useApproveIDRX, usePauseVault, useVaultPaused, useTxState,
} from "@/lib/contracts";
import { getErrorMessage } from "@/lib/safe";
import { StateBadge } from "@/components/ui/StateBadge";
import { formatIDRX, formatDate, formatDuration, stateLabel } from "@/lib/formatters";
import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Loader2, ArrowRight, Cpu, RefreshCw } from "lucide-react";
import {
  AnimatedNumber,
  TiltCard,
  MagneticButton,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";

function TxFeedback({ status, hash, error }: { status: string; hash: string; error: string }) {
  if (status === "idle") return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="mt-3 space-y-1 text-xs"
      >
        {status === "approving" && (
          <p className="text-amber-500 font-bold flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Approving IDRX spend…</p>
        )}
        {status === "awaiting_signature" && (
          <p className="text-amber-500 font-bold flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />Confirm signature in wallet…</p>
        )}
        {status === "confirmed" && (
          <p className="text-emerald-500 font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />Transaction confirmed on-chain</p>
        )}
        {status === "failed" && (
          <p className="text-red-500 font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-red-500" />{error || "Transaction failed"}</p>
        )}
        {hash && (
          <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer"
            className="text-xs font-mono text-ring font-bold hover:underline truncate block">
            View Etherscan Transaction &rarr;
          </a>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: vaultStateRaw, refetch: refetchState } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();
  const { data: idrxBal } = useIDRXBalance(address);
  const { data: paused, refetch: refetchPaused } = useVaultPaused();

  const s = Number(vaultStateRaw ?? 0);
  const isAdmin = address?.toLowerCase() === ADDRESSES.protocolAdmin.toLowerCase();

  // Step 1 — Create Vault
  const [maxQuotaInput, setMaxQuotaInput] = useState("");
  const [durationDays, setDurationDays] = useState("180");
  const [apyBps, setApyBps] = useState("500");
  const createTx = useTxState();
  const { createVault } = useCreateVault();

  // Step 3 — Protocol Fill
  const [fillAmount, setFillAmount] = useState("");
  const fillTx = useTxState();
  const { protocolFill } = useProtocolFill();
  const { approve } = useApproveIDRX();

  // Step 5 — Send Payout
  const [payoutAmount, setPayoutAmount] = useState("");
  const payoutTx = useTxState();
  const { sendPayout } = useSendPayout();

  // Close Vault
  const closeTx = useTxState();
  const { closeVault } = useCloseVault();

  // Pause
  const pauseTx = useTxState();
  const { pause, unpause } = usePauseVault();

  const refetchAll = () => {
    refetchState();
    refetchPaused();
    params.maxQuota.refetch();
    params.duration.refetch();
    params.apy.refetch();
    params.lockStartTime.refetch();
    params.vaultCreated.refetch();
    totals.totalAssets.refetch();
    totals.totalSupply.refetch();
  };

  async function handleCreateVault(e: React.FormEvent) {
    e.preventDefault();
    if (!maxQuotaInput || !durationDays || !apyBps) return;
    try {
      createTx.setStatus("awaiting_signature");
      createTx.setError("");
      const mq = BigInt(Math.floor(parseFloat(maxQuotaInput) * 1e18));
      const dur = BigInt(parseInt(durationDays) * 86400);
      const apy = BigInt(parseInt(apyBps));
      const txHash = await createVault(mq, dur, apy);
      createTx.setHash(txHash);
      createTx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      createTx.setStatus("failed");
      createTx.setError(getErrorMessage(e));
    }
  }

  async function handleProtocolFill(e: React.FormEvent) {
    e.preventDefault();
    if (!fillAmount || !address) return;
    const amt = BigInt(Math.floor(parseFloat(fillAmount) * 1e18));
    try {
      fillTx.setStatus("approving");
      fillTx.setError("");
      await approve(CONTRACTS.sukukVault, amt);
      fillTx.setStatus("awaiting_signature");
      const txHash = await protocolFill(amt);
      fillTx.setHash(txHash);
      fillTx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      fillTx.setStatus("failed");
      fillTx.setError(getErrorMessage(e));
    }
  }

  async function handleSendPayout(e: React.FormEvent) {
    e.preventDefault();
    if (!payoutAmount || !address) return;
    const amt = BigInt(Math.floor(parseFloat(payoutAmount) * 1e18));
    try {
      payoutTx.setStatus("approving");
      payoutTx.setError("");
      await approve(CONTRACTS.sukukVault, amt);
      payoutTx.setStatus("awaiting_signature");
      const txHash = await sendPayout(amt);
      payoutTx.setHash(txHash);
      payoutTx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      payoutTx.setStatus("failed");
      payoutTx.setError(getErrorMessage(e));
    }
  }

  async function handleCloseVault() {
    try {
      closeTx.setStatus("awaiting_signature");
      closeTx.setError("");
      const txHash = await closeVault();
      closeTx.setHash(txHash);
      closeTx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      closeTx.setStatus("failed");
      closeTx.setError(getErrorMessage(e));
    }
  }

  async function handleTogglePause() {
    try {
      pauseTx.setStatus("awaiting_signature");
      pauseTx.setError("");
      const txHash = paused ? await unpause() : await pause();
      pauseTx.setHash(txHash);
      pauseTx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      pauseTx.setStatus("failed");
      pauseTx.setError(getErrorMessage(e));
    }
  }

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="container py-24 flex items-center justify-center min-h-[65vh]">
          <TiltCard maxTilt={8} className="max-w-md w-full">
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-ring">
                <Shield className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Admin Access Required</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your Ethereum wallet possessing PROTOCOL_ROLE administrative credentials to access protocol operations.
                </p>
              </div>
            </div>
          </TiltCard>
        </div>
      </PageTransition>
    );
  }

  const maxQuota = Number((params.maxQuota.data ?? 0n) as bigint) / 1e18;
  const totalAssets = Number((totals.totalAssets.data ?? 0n) as bigint) / 1e18;
  const remaining = maxQuota - totalAssets;
  const lockStart = Number((params.lockStartTime.data ?? 0n) as bigint);
  const dur = Number((params.duration.data ?? 0n) as bigint);

  return (
    <PageTransition>
      <div className="container py-12 space-y-10">
        <FadeIn direction="down" className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-line" />
              <span>01 &middot; PROTOCOL GOVERNANCE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Cpu className="w-8 h-8 text-ring" /> Admin Control Terminal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
              CONNECTED ADMIN: {address}
            </p>
          </div>

          <button onClick={refetchAll} className="button text-xs py-2 self-start md:self-auto shadow-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh On-Chain State</span>
          </button>
        </FadeIn>

        {!isAdmin && (
          <FadeIn direction="up">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
              <p className="text-xs text-amber-800 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Warning: Connected wallet is not the Protocol Admin address. Administrative contract calls will revert.
              </p>
            </div>
          </FadeIn>
        )}

        {/* Bento Grid Metrics */}
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
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Vault Initialized</span>
                <p className="text-xl font-mono font-bold text-foreground">{params.vaultCreated.data ? "YES" : "NO"}</p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Circuit Breaker</span>
                <p className={`text-xl font-mono font-bold ${paused ? "text-red-500" : "text-emerald-500"}`}>{paused ? "PAUSED" : "ACTIVE"}</p>
              </div>
            </TiltCard>
          </StaggerItem>

          {idrxBal !== undefined && (
            <StaggerItem>
              <TiltCard maxTilt={5}>
                <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                  <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Treasury IDRX Balance</span>
                  <p className="text-xl font-mono font-bold text-foreground">
                    <AnimatedNumber value={Number(idrxBal) / 1e18} suffix=" IDRX" decimals={0} />
                  </p>
                </div>
              </TiltCard>
            </StaggerItem>
          )}
        </StaggerContainer>

        {/* Admin Action Panels */}
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-8" staggerDelay={0.1}>
          {/* Step 1 — Create Vault */}
          <StaggerItem>
            <ActionCard
              step="01"
              title="Create Vault"
              description="Initialize on-chain vault quota, lock duration, and target yield parameters."
              requiredState="Not Created"
              enabled={!params.vaultCreated.data}
              currentState={s}
            >
              <form onSubmit={handleCreateVault} className="space-y-4">
                <InputField id="max-quota" label="Max Quota (IDRX)" value={maxQuotaInput} onChange={setMaxQuotaInput} placeholder="e.g. 1000000" />
                <InputField id="duration-days" label="Duration (days)" value={durationDays} onChange={setDurationDays} placeholder="180" />
                <InputField id="apy-bps" label="Target APY (Basis Points)" value={apyBps} onChange={setApyBps} placeholder="500 = 5%" />
                <MagneticButton className="w-full">
                  <ActionButton disabled={!maxQuotaInput || createTx.status === "awaiting_signature"} status={createTx.status}>
                    Create Vault
                  </ActionButton>
                </MagneticButton>
                <TxFeedback status={createTx.status} hash={createTx.hash} error={createTx.error} />
              </form>
            </ActionCard>
          </StaggerItem>

          {/* Step 3 — Protocol Fill */}
          <StaggerItem>
            <ActionCard
              step="03"
              title="Protocol Fill"
              description="Top up vault quota directly from protocol treasury."
              requiredState="OPEN (0)"
              enabled={s === 0 && !!params.vaultCreated.data}
              currentState={s}
            >
              <form onSubmit={handleProtocolFill} className="space-y-4">
                {maxQuota > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Remaining unfilled quota: <span className="font-mono font-bold text-foreground">{formatIDRX(remaining * 1e18)}</span>
                  </p>
                )}
                <InputField id="fill-amount" label="Fill Amount (IDRX)" value={fillAmount} onChange={setFillAmount} placeholder="e.g. 500000" />
                {remaining > 0 && (
                  <button type="button" onClick={() => setFillAmount(remaining.toString())} className="text-xs text-ring font-bold hover:underline block">
                    Set to remaining quota ({formatIDRX(remaining * 1e18)})
                  </button>
                )}
                <MagneticButton className="w-full">
                  <ActionButton disabled={!fillAmount || fillTx.status === "awaiting_signature" || fillTx.status === "approving"} status={fillTx.status}>
                    Execute Protocol Fill
                  </ActionButton>
                </MagneticButton>
                <TxFeedback status={fillTx.status} hash={fillTx.hash} error={fillTx.error} />
              </form>
            </ActionCard>
          </StaggerItem>

          {/* Step 5 — Send Payout */}
          <StaggerItem>
            <ActionCard
              step="05"
              title="Send Payout & Yield"
              description="Fund the return payout at maturity. Increases underlying share value exchange rate."
              requiredState="LOCKED (1)"
              enabled={s === 1}
              currentState={s}
            >
              <form onSubmit={handleSendPayout} className="space-y-4">
                {lockStart > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1 bg-secondary/50 p-3 rounded-xl border border-border font-mono">
                    <p>Vault Locked Date: <span className="font-bold text-foreground">{formatDate(lockStart)}</span></p>
                    <p>Maturity End Date: <span className="font-bold text-foreground">{formatDate(lockStart + dur)}</span></p>
                    <p>Lock Duration: <span className="font-bold text-foreground">{formatDuration(dur)}</span></p>
                  </div>
                )}
                <InputField id="payout-amount" label="Yield Payout Amount (IDRX)" value={payoutAmount} onChange={setPayoutAmount} placeholder="e.g. 50000" />
                <MagneticButton className="w-full">
                  <ActionButton disabled={!payoutAmount || payoutTx.status === "awaiting_signature" || payoutTx.status === "approving"} status={payoutTx.status}>
                    Send Payout
                  </ActionButton>
                </MagneticButton>
                <TxFeedback status={payoutTx.status} hash={payoutTx.hash} error={payoutTx.error} />
              </form>
            </ActionCard>
          </StaggerItem>

          {/* Close Vault + Pause */}
          <StaggerItem>
            <ActionCard
              step="CTRL"
              title="Emergency & Close Controls"
              description="Perform terminal vault closure or toggle global circuit breaker."
              requiredState="APPROVED FOR PAYOUT (3)"
              enabled={true}
              currentState={s}
            >
              <div className="space-y-4">
                <MagneticButton className="w-full">
                  <ActionButton type="button" onClick={handleCloseVault} disabled={s !== 3 || closeTx.status === "awaiting_signature"} status={closeTx.status}>
                    Close Vault
                  </ActionButton>
                </MagneticButton>
                <TxFeedback status={closeTx.status} hash={closeTx.hash} error={closeTx.error} />

                <div className="border-t border-border pt-4" />

                <MagneticButton className="w-full">
                  <ActionButton type="button" onClick={handleTogglePause} disabled={pauseTx.status === "awaiting_signature"} status={pauseTx.status} variant="warning">
                    {paused ? "Unpause Vault Circuit Breaker" : "Pause Vault Circuit Breaker"}
                  </ActionButton>
                </MagneticButton>
                <TxFeedback status={pauseTx.status} hash={pauseTx.hash} error={pauseTx.error} />
              </div>
            </ActionCard>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function ActionCard({ step, title, description, requiredState, enabled, currentState, children }: {
  step: string; title: string; description: string; requiredState: string; enabled: boolean; currentState: number; children: React.ReactNode;
}) {
  return (
    <TiltCard maxTilt={4} className={`h-full ${enabled ? "" : "opacity-80"}`}>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xs h-full flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.6875rem] font-bold text-ring bg-ring/10 border border-ring/30 px-2.5 py-0.5 rounded-full">{step}</span>
            <h2 className="font-bold text-lg text-foreground">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <p className="text-[0.6875rem] text-muted-foreground font-mono">Required State: {requiredState} &middot; Current: {stateLabel(currentState)}</p>
        </div>
        <div>{children}</div>
      </div>
    </TiltCard>
  );
}

function InputField({ id, label, value, onChange, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step="0.01"
        min="0"
        className="w-full px-4 py-2.5 text-sm font-mono font-bold bg-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground/50 text-foreground"
      />
    </div>
  );
}

function ActionButton({ onClick, disabled, status, children, variant = "default", type = "submit" }: {
  onClick?: () => void; disabled: boolean; status: string; children: React.ReactNode; variant?: "default" | "warning"; type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full button justify-center text-xs font-bold py-3 disabled:opacity-40 ${variant === "warning" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
    >
      {status === "awaiting_signature" || status === "approving" ? (
        <><Loader2 className="w-4 h-4 animate-spin" />{status === "approving" ? "Approving Spend…" : "Confirm in Wallet…"}</>
      ) : (
        <>{children} <ArrowRight className="w-4 h-4" /></>
      )}
    </button>
  );
}
