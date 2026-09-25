"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { CONTRACTS } from "@/contracts/addresses";
import {
  useApproveIDRX,
  useIDRXBalance,
  useSukukBalance,
  useSukukDeposit,
  useSukukRedeem,
  useTxState,
  useVaultParameters,
  useVaultState,
  useVaultTotals,
} from "@/lib/contracts";
import { getErrorMessage } from "@/lib/safe";
import {
  basisPointsToPercent,
  compactAddress,
  formatDate,
  formatDuration,
  formatIDRX,
  formatTokenAmount,
  parseTokenAmount,
  toDisplayNumber,
} from "@/lib/formatters";
import { PageHeader } from "@/components/ui/PageHeader";
import { KeyFigures } from "@/components/ui/KeyFigures";
import { Panel } from "@/components/ui/Panel";
import { Field } from "@/components/ui/Field";
import { TxNotice } from "@/components/ui/TxNotice";
import { StateBadge } from "@/components/ui/StateBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { AnimatedNumber, EASE, PageTransition, Press, Reveal } from "@/components/ui/motion";

const STATES = [
  { title: "Open", desc: "Deposits accepted until the quota is full." },
  { title: "Locked", desc: "The auditor Safe locked the round. Nothing moves." },
  { title: "Matured", desc: "The payout is funded. Waiting on the auditor Safe." },
  { title: "Approved for payout", desc: "Redemption is open for every holder." },
  { title: "Closed", desc: "Settled. Redemption stays open for remaining holders." },
];

export default function SukukPage() {
  const { address, isConnected } = useAccount();
  const { data: state, isLoading: stateLoading } = useVaultState();
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
  const canRedeem = s === 3 || s === 4;

  const maxQuota = toDisplayNumber(params.maxQuota.data);
  const totalAssets = toDisplayNumber(totals.totalAssets.data);
  const totalSupply = toDisplayNumber(totals.totalSupply.data);
  const filledPct = maxQuota > 0 ? Math.min(100, (totalAssets / maxQuota) * 100) : 0;
  const lockStart = Number(params.lockStartTime.data ?? 0n);
  const dur = Number(params.duration.data ?? 0n);
  const exchangeRate = totalSupply > 0 ? totalAssets / totalSupply : 1;
  const position = sukukBal ? toDisplayNumber(sukukBal) : 0;

  const tx = tab === "deposit" ? depositTx : redeemTx;
  const busy = tx.status === "approving" || tx.status === "awaiting_signature" || tx.status === "pending";
  const parsed = parseTokenAmount(amount);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (parsed <= 0n || !address) return;
    try {
      depositTx.setError("");
      depositTx.setHash("");
      depositTx.setStatus("approving");
      await approve(CONTRACTS.sukukVault, parsed);
      depositTx.setStatus("awaiting_signature");
      const hash = await deposit(parsed, address);
      depositTx.setHash(hash);
      depositTx.setStatus("confirmed");
      setAmount("");
    } catch (err: unknown) {
      depositTx.setStatus("failed");
      depositTx.setError(getErrorMessage(err));
    }
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (parsed <= 0n || !address) return;
    try {
      redeemTx.setError("");
      redeemTx.setHash("");
      redeemTx.setStatus("awaiting_signature");
      const hash = await redeem(parsed, address, address);
      redeemTx.setHash(hash);
      redeemTx.setStatus("confirmed");
      setAmount("");
    } catch (err: unknown) {
      redeemTx.setStatus("failed");
      redeemTx.setError(getErrorMessage(err));
    }
  }

  return (
    <PageTransition>
      <div className="container pb-24">
        <PageHeader
          kicker="Vault terminal"
          title="Sepolia Sukuk Vault"
          description="Deposit IDRX while the round is open. Redeem principal plus the funded payout once the auditor Safe approves it."
          aside={
            <div className="flex flex-wrap items-center gap-3">
              {stateLoading ? <Skeleton className="h-6 w-24" /> : <StateBadge state={s} />}
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACTS.sukukVault}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground hover:text-forest"
              >
                {compactAddress(CONTRACTS.sukukVault)} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          }
        />

        <Reveal delay={0.05}>
          <KeyFigures
            figures={[
              {
                label: "Subscribed",
                lead: true,
                loading: totals.totalAssets.isLoading,
                value: <AnimatedNumber value={totalAssets} suffix=" IDRX" />,
                note: maxQuota > 0 ? `of ${formatIDRX(maxQuota)} IDRX quota` : "No round configured",
              },
              {
                label: "Share price",
                value: `${exchangeRate.toFixed(4)}`,
                note: "IDRX per sSUKUK. Rises when the payout lands.",
              },
              {
                label: "Target yield",
                value: params.apy.data !== undefined ? basisPointsToPercent(Number(params.apy.data)) : "Not set",
                note: `Lock period ${formatDuration(dur)}`,
              },
              {
                label: "Maturity",
                value: lockStart > 0 ? formatDate(lockStart + dur) : "Not locked",
                note: lockStart > 0 ? "When the payout can be funded" : "Starts when the auditor Safe locks",
              },
            ]}
          />
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <Panel title="Subscription" description="IDRX deposited against the round's quota." delay={0.05}>
              {maxQuota > 0 ? (
                <>
                  <div className="flex items-end justify-between gap-4">
                    <p className="figure text-4xl font-medium leading-none">{filledPct.toFixed(1)}%</p>
                    <p className="text-right text-[13px] text-muted-foreground">
                      <span className="figure text-ink">{formatIDRX(totalAssets)}</span> / {formatIDRX(maxQuota)} IDRX
                    </p>
                  </div>
                  <div
                    className="mt-5 h-3 overflow-hidden rounded-full bg-mint"
                    role="progressbar"
                    aria-label="Quota filled"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(filledPct)}
                  >
                    <motion.div
                      className="h-full rounded-full bg-forest"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${filledPct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: EASE }}
                    />
                  </div>
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-[13px]">
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <dt className="text-muted-foreground">Shares issued</dt>
                      <dd className="figure mt-1 text-base text-ink">{formatIDRX(totalSupply)} sSUKUK</dd>
                    </div>
                    <div className="rounded-xl bg-mist px-4 py-3">
                      <dt className="text-muted-foreground">Quota remaining</dt>
                      <dd className="figure mt-1 text-base text-ink">{formatIDRX(Math.max(0, maxQuota - totalAssets))} IDRX</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="rounded-xl bg-mist px-4 py-4 text-sm text-muted-foreground">
                  The protocol has not configured a round yet. The quota and progress appear here once it calls createVault().
                </p>
              )}
            </Panel>

            <Panel title="Lifecycle" description="Where this round is, read from the contract." delay={0.1} bodyClassName="p-3">
              <ol>
                {STATES.map((st, i) => {
                  const active = i === s;
                  const done = i < s;
                  return (
                    <li
                      key={st.title}
                      className={`flex items-start gap-4 rounded-2xl px-4 py-4 transition-colors ${active ? "bg-mint" : ""}`}
                    >
                      <span
                        className={`figure mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs ${
                          active ? "bg-forest text-white" : done ? "bg-mint-2 text-forest-deep" : "border border-line-strong text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[15px] font-semibold ${active || done ? "text-ink" : "text-muted-foreground"}`}>
                          {st.title}
                          {active && <span className="ml-2 align-middle text-xs font-medium text-forest">Current</span>}
                        </p>
                        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{st.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </div>

          <aside className="lg:col-span-5">
            <Reveal delay={0.1} className="panel sticky top-24 overflow-hidden">
              <div className="p-2">
                <div className="relative grid grid-cols-2 rounded-full bg-mist p-1" role="tablist" aria-label="Action">
                  {(["deposit", "redeem"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={tab === t}
                      onClick={() => {
                        setTab(t);
                        setAmount("");
                      }}
                      className={`relative z-10 min-h-10 rounded-full text-sm font-semibold transition-colors ${
                        tab === t ? "text-forest-deep" : "text-muted-foreground hover:text-ink"
                      }`}
                    >
                      {tab === t && (
                        <motion.span
                          layoutId="terminal-tab"
                          className="absolute inset-0 -z-10 rounded-full bg-white shadow-[0_1px_3px_#0c1f1714]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      {t === "deposit" ? "Deposit" : "Redeem"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6 pt-4">
                <AnimatePresence mode="wait">
                  {!isConnected ? (
                    <motion.div key="connect" {...fade} className="rounded-2xl bg-mist px-5 py-8 text-center">
                      <p className="title text-lg">Connect a wallet</p>
                      <p className="mx-auto mt-2 max-w-[32ch] text-[13px] leading-relaxed text-muted-foreground">
                        Use a wallet on Sepolia to deposit IDRX or redeem sSUKUK.
                      </p>
                      <div className="mt-5 flex justify-center">
                        <WalletConnect />
                      </div>
                    </motion.div>
                  ) : tab === "deposit" && !isOpen ? (
                    <motion.div key="deposit-closed" {...fade} className="rounded-2xl bg-amber-soft px-5 py-5 text-[13px] text-amber">
                      <p className="font-semibold">Deposits are closed</p>
                      <p className="mt-1 leading-relaxed">The round is {STATES[s]?.title.toLowerCase()}. Deposits are only accepted while it is open.</p>
                    </motion.div>
                  ) : tab === "redeem" && !canRedeem ? (
                    <motion.div key="redeem-closed" {...fade} className="rounded-2xl bg-amber-soft px-5 py-5 text-[13px] text-amber">
                      <p className="font-semibold">Redemption is not open yet</p>
                      <p className="mt-1 leading-relaxed">It opens after the auditor Safe calls approvePayout().</p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key={tab}
                      {...fade}
                      onSubmit={tab === "deposit" ? handleDeposit : handleRedeem}
                      className="space-y-5"
                    >
                      <Field
                        id="amount"
                        label={tab === "deposit" ? "Amount to deposit" : "Shares to redeem"}
                        unit={tab === "deposit" ? "IDRX" : "sSUKUK"}
                        value={amount}
                        onChange={setAmount}
                        hint={
                          tab === "deposit"
                            ? `Wallet ${formatIDRX(idrxBal ?? 0n)} IDRX`
                            : `Held ${formatIDRX(sukukBal ?? 0n)} sSUKUK`
                        }
                        onFill={() => setAmount(formatTokenAmount(tab === "deposit" ? idrxBal : sukukBal))}
                      />

                      {parsed > 0n && (
                        <p className="rounded-xl bg-mist px-4 py-3 text-[13px] text-muted-foreground">
                          You receive about{" "}
                          <span className="figure font-medium text-ink">
                            {tab === "deposit"
                              ? `${formatIDRX(toDisplayNumber(parsed) / exchangeRate)} sSUKUK`
                              : `${formatIDRX(toDisplayNumber(parsed) * exchangeRate)} IDRX`}
                          </span>
                          {tab === "deposit" && " after two wallet prompts: approve, then deposit."}
                        </p>
                      )}

                      <Press className="w-full">
                        <button type="submit" disabled={parsed <= 0n || busy} className="btn btn-primary w-full">
                          {busy
                            ? "Waiting for wallet…"
                            : tab === "deposit"
                              ? "Deposit IDRX"
                              : "Redeem sSUKUK"}
                        </button>
                      </Press>

                      <TxNotice status={tx.status} hash={tx.hash} error={tx.error} />
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {isConnected && position > 0 && (
                <dl className="grid grid-cols-2 border-t border-line bg-mist text-[13px]">
                  <div className="px-6 py-4">
                    <dt className="text-muted-foreground">Your shares</dt>
                    <dd className="figure mt-1 text-base text-ink">{formatIDRX(position)}</dd>
                  </div>
                  <div className="border-l border-line px-6 py-4">
                    <dt className="text-muted-foreground">Worth now</dt>
                    <dd className="figure mt-1 text-base text-ink">{formatIDRX(position * exchangeRate)} IDRX</dd>
                  </div>
                </dl>
              )}
            </Reveal>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: EASE },
};
