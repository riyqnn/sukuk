"use client";

import { useAccount } from "wagmi";
import { CONTRACTS } from "@/contracts/addresses";
import {
  useVaultState, useVaultParameters, useVaultTotals,
  useIDRXBalance, useSukukBalance,
  useSukukDeposit, useSukukRedeem,
  useApproveIDRX, useTxState,
} from "@/lib/contracts";
import { getErrorMessage } from "@/lib/safe";
import { StateBadge } from "@/components/ui/StateBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { FundingBar, MiniBars } from "@/components/ui/Chart";
import { formatIDRX, formatDate, formatDuration, basisPointsToPercent } from "@/lib/formatters";
import { useState, useEffect } from "react";
import { ArrowRight, Clock, Layers, Sparkles, TrendingUp, ShieldCheck } from "lucide-react";
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

export default function SukukPage() {
  const { address, isConnected } = useAccount();
  const { data: state } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();
  const { data: idrxBal } = useIDRXBalance(address);
  const { data: sukukBal } = useSukukBalance(address);

  const [amount, setAmount] = useState("");
  const [tab, setTab] = useState<"deposit" | "redeem">("deposit");
  const depositTx = useTxState();
  const redeemTx = useTxState();
  const { deposit } = useSukukDeposit();
  const { redeem } = useSukukRedeem();
  const { approve } = useApproveIDRX();

  const s = Number(state ?? 0);
  const isOpen = s === 0;
  const canRedeem = s === 3;

  const maxQuota = Number((params.maxQuota.data ?? 0n) as bigint) / 1e18;
  const totalAssets = Number((totals.totalAssets.data ?? 0n) as bigint) / 1e18;
  const totalSupply = Number((totals.totalSupply.data ?? 0n) as bigint) / 1e18;
  const filledPct = maxQuota > 0 ? ((totalAssets / maxQuota) * 100) : 0;

  const lockStart = Number((params.lockStartTime.data ?? 0n) as bigint);
  const dur = Number((params.duration.data ?? 0n) as bigint);
  const unlockDate = lockStart > 0 ? formatDate(lockStart + dur) : "—";

  const exchangeRate = totalSupply > 0 ? totalAssets / totalSupply : 1;
  const position = sukukBal ? Number(sukukBal) / 1e18 : 0;
  const positionValue = position * exchangeRate;

  useEffect(() => { if (depositTx.status === "confirmed") setAmount(""); }, [depositTx.status]);

  async function handleDepositSubmit(e: React.FormEvent) {
    e.preventDefault();
    const assets = BigInt(Math.floor(parseFloat(amount || "0") * 1e18));
    if (assets <= 0n || !address) return;
    try {
      depositTx.setStatus("approving");
      depositTx.setError("");
      await approve(CONTRACTS.sukukVault, assets);
      depositTx.setStatus("awaiting_signature");
      const txHash = await deposit(assets, address);
      depositTx.setHash(txHash);
      depositTx.setStatus("confirmed");
    } catch (e: unknown) {
      depositTx.setStatus("failed");
      depositTx.setError(getErrorMessage(e));
    }
  }

  async function handleRedeemSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shares = BigInt(Math.floor(parseFloat(amount || "0") * 1e18));
    if (shares <= 0n || !address) return;
    try {
      redeemTx.setStatus("awaiting_signature");
      redeemTx.setError("");
      const txHash = await redeem(shares, address, address);
      redeemTx.setHash(txHash);
      redeemTx.setStatus("confirmed");
    } catch (e: unknown) {
      redeemTx.setStatus("failed");
      redeemTx.setError(getErrorMessage(e));
    }
  }

  return (
    <PageTransition>
      <div className="container pb-24 pt-8">
        {/* Digital Asset Terminal Top Header */}
        <FadeIn direction="down" className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-mono font-bold text-xs shadow-inner">
              SKK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Sepolia Sukuk Vault #1</h1>
                {state !== undefined ? <StateBadge state={s} /> : <Skeleton className="h-5 w-20" />}
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                CONTRACT: {CONTRACTS.sukukVault}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PulseGlowBadge text="ERC-4626 COMPLIANT" color="emerald" />
          </div>
        </FadeIn>

        {/* Metric Cards Grid */}
        <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-5 my-8" staggerDelay={0.07}>
          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Total Assets Deposited
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {totals.totalAssets.isLoading ? (
                    <Skeleton className="h-7 w-28" />
                  ) : (
                    <AnimatedNumber value={totalAssets} suffix=" IDRX" decimals={0} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Underlying IDRX balance held in vault
                </p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Subscription Capacity
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {maxQuota > 0 ? (
                    <AnimatedNumber value={filledPct} suffix="%" decimals={1} />
                  ) : (
                    "—"
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Target Quota: {formatIDRX(maxQuota)} IDRX
                </p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Maturity Unlock
                </span>
                <div className="text-xl font-bold tracking-tight text-foreground font-mono truncate">
                  {lockStart > 0 ? unlockDate : "Not Locked"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {lockStart > 0 ? `${formatDuration(dur)} Lock Period` : "Pending Lock Audit"}
                </p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Protocol Yield Rate
                </span>
                <div className="text-2xl font-bold tracking-tight text-ring font-mono">
                  {params.apy.data !== undefined ? basisPointsToPercent(Number(params.apy.data)) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Exchange parity: 1 sSUKUK = {exchangeRate.toFixed(4)} IDRX
                </p>
              </div>
            </TiltCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Main Terminal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Progress + Breakdown + Lifecycle Timeline */}
          <div className="lg:col-span-7 space-y-8">
            {/* Funding Progress Visualizer */}
            <FadeIn direction="up" delay={0.1} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-ring" />
                  Subscription Progress
                </h2>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  {formatIDRX(totalAssets)} / {formatIDRX(maxQuota)} IDRX
                </span>
              </div>

              {maxQuota > 0 ? (
                <FundingBar filled={totalAssets} total={maxQuota} />
              ) : (
                <p className="text-xs text-muted-foreground bg-secondary p-4 rounded-lg border">
                  Vault has not yet been configured by protocol admin.
                </p>
              )}
            </FadeIn>

            {/* Asset Composition breakdown */}
            {totalAssets > 0 && (
              <FadeIn direction="up" delay={0.15} className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ring" />
                  Asset Composition Breakdown
                </h2>
                <MiniBars
                  items={[
                    { label: "IDRX Vault Capital", value: totalAssets, max: totalAssets },
                    { label: "sSUKUK Token Shares Minted", value: totalSupply, max: totalAssets },
                  ]}
                />
              </FadeIn>
            )}

            {/* Lifecycle Sequence */}
            <FadeIn direction="up" delay={0.2} className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-2xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-ring" />
                Vault Lifecycle Status
              </h2>

              <StaggerContainer className="space-y-3 font-mono text-xs" staggerDelay={0.05}>
                <StaggerItem>
                  <LifecycleStep number="01" title="Vault Created" desc="Admin initialized vault parameters and quota." done={s >= 0} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="02" title="Public Subscription" desc="Investors deposit IDRX stablecoins for sSUKUK shares." done={s >= 0} active={s === 0} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="03" title="Protocol Fill" desc="Admin fills remaining quota if applicable." done={s >= 1} active={s === 1} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="04" title="Audit 1 Lock (Safe Multisig)" desc="Safe Auditor verifies RWA backing & locks funds." done={s >= 2} active={s === 2} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="05" title="Yield Accrual & Maturity" desc="Underlying Sukuk asset generates yield over lock duration." done={s >= 3} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="06" title="Audit 2 Payout (Safe Multisig)" desc="Auditor approves payout injection & redemption unlock." done={s >= 3} active={s === 3} />
                </StaggerItem>
                <StaggerItem>
                  <LifecycleStep number="07" title="Share Redemption & Close" desc="Token holders redeem sSUKUK for IDRX principal + yield." done={s === 4} />
                </StaggerItem>
              </StaggerContainer>
            </FadeIn>
          </div>

          {/* Right Column: Interactive Terminal Form */}
          <aside className="lg:col-span-5">
            <TiltCard maxTilt={4} className="sticky top-20">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-md">
                {/* Tab Selector with Framer Motion Sliding Pill */}
                <div className="relative flex rounded-full bg-secondary p-1 border border-border">
                  <button
                    type="button"
                    onClick={() => { setTab("deposit"); setAmount(""); }}
                    className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-200 ${
                      tab === "deposit" ? "text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Deposit IDRX
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab("redeem"); setAmount(""); }}
                    className={`relative z-10 flex-1 py-2 text-xs font-semibold rounded-full transition-colors duration-200 ${
                      tab === "redeem" ? "text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Redeem Shares
                  </button>

                  <motion.div
                    layoutId="activeTerminalTab"
                    className="absolute inset-y-1 bg-primary rounded-full"
                    style={{
                      left: tab === "deposit" ? "4px" : "50%",
                      width: "calc(50% - 4px)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                </div>

                {/* Form / State logic */}
                <AnimatePresence mode="wait">
                  {!isConnected ? (
                    <motion.div
                      key="not-connected"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-secondary/70 border border-border rounded-xl p-6 text-center space-y-3"
                    >
                      <Sparkles className="w-6 h-6 mx-auto text-ring" />
                      <p className="text-xs font-medium text-muted-foreground">
                        Connect your wallet to execute Web3 vault transactions on Sepolia.
                      </p>
                    </motion.div>
                  ) : tab === "deposit" && !isOpen ? (
                    <motion.div
                      key="deposit-locked"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900 space-y-1"
                    >
                      <p className="font-semibold">Vault is currently not in OPEN state.</p>
                      <p className="text-muted-foreground">Deposits are restricted during lock and audit phases.</p>
                    </motion.div>
                  ) : tab === "redeem" && !canRedeem ? (
                    <motion.div
                      key="redeem-locked"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900 space-y-1"
                    >
                      <p className="font-semibold">Redemptions are currently locked.</p>
                      <p className="text-muted-foreground">Shares can be redeemed after Audit 2 (Payout Approval) by Safe Multisig.</p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key={tab}
                      initial={{ opacity: 0, x: tab === "deposit" ? -15 : 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: tab === "deposit" ? 15 : -15 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      onSubmit={tab === "deposit" ? handleDepositSubmit : handleRedeemSubmit}
                      className="space-y-5"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label htmlFor="amount-input" className="block text-xs uppercase tracking-wider font-bold text-foreground">
                            {tab === "deposit" ? "Deposit Amount (IDRX)" : "Redeem Shares (sSUKUK)"}
                          </label>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {tab === "deposit"
                              ? `Bal: ${formatIDRX((idrxBal ?? 0n) as bigint)} IDRX`
                              : `Bal: ${formatIDRX((sukukBal ?? 0n) as bigint)} sSUKUK`}
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            id="amount-input"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-4 py-3.5 text-2xl font-mono font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground/30"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (tab === "deposit" && idrxBal) {
                                setAmount((Number(idrxBal) / 1e18).toString());
                              } else if (tab === "redeem" && sukukBal) {
                                setAmount((Number(sukukBal) / 1e18).toString());
                              }
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.625rem] font-mono font-bold uppercase px-2 py-1 bg-secondary border border-border rounded hover:bg-border transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                      </div>

                      <MagneticButton className="w-full">
                        <button
                          type="submit"
                          disabled={!amount || parseFloat(amount) <= 0 || depositTx.status === "awaiting_signature" || depositTx.status === "approving" || redeemTx.status === "awaiting_signature"}
                          className="w-full button justify-center py-3.5 shadow-md text-xs font-bold disabled:opacity-40"
                        >
                          {tab === "deposit" ? (
                            depositTx.status === "idle" ? "Deposit IDRX Stablecoin" :
                            depositTx.status === "approving" ? "1/2 Approving IDRX Allowance…" :
                            depositTx.status === "awaiting_signature" ? "2/2 Sign Deposit in Wallet…" :
                            depositTx.status === "confirmed" ? "Deposit Complete!" : "Retry Deposit"
                          ) : (
                            redeemTx.status === "idle" ? "Redeem sSUKUK Shares" :
                            redeemTx.status === "awaiting_signature" ? "Sign Redeem in Wallet…" :
                            redeemTx.status === "confirmed" ? "Redemption Complete!" : "Retry Redeem"
                          )}
                        </button>
                      </MagneticButton>

                      {(depositTx.status === "failed" || redeemTx.status === "failed") && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-700">
                          {(tab === "deposit" ? depositTx.error : redeemTx.error) || "Transaction failed."}
                        </div>
                      )}

                      {(depositTx.hash || redeemTx.hash) && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${depositTx.hash || redeemTx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-center text-xs font-mono text-ring hover:underline truncate"
                        >
                          View Tx on Sepolia Explorer &rarr;
                        </a>
                      )}
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Connected Account Position Summary */}
                {isConnected && sukukBal !== undefined && (sukukBal as bigint) > 0n && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t border-border pt-4 space-y-3"
                  >
                    <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-bold">
                      Your Investment Position
                    </p>
                    <div className="space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">sSUKUK Shares</span>
                        <span className="font-bold text-foreground">{formatIDRX(sukukBal as bigint)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Underlying Value</span>
                        <span className="font-bold text-foreground">{formatIDRX(positionValue)} IDRX</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </TiltCard>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

/* ── Helper Component ────────────────────────────────────────────── */

function LifecycleStep({
  number,
  title,
  desc,
  done,
  active,
}: {
  number: string;
  title: string;
  desc: string;
  done?: boolean;
  active?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-4 p-3 rounded-lg border transition-all ${
        active
          ? "bg-secondary border-ring/50 shadow-2xs"
          : done
          ? "bg-card border-border opacity-90"
          : "bg-transparent border-transparent opacity-50"
      }`}
    >
      <span className={`px-2 py-0.5 rounded text-[0.625rem] font-bold ${active ? "bg-ring text-white" : "bg-border text-foreground"}`}>
        {number}
      </span>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2 font-sans font-bold text-foreground text-xs">
          <span>{title}</span>
          {active && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        </div>
        <p className="font-sans text-[0.75rem] text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}