"use client";

import { useState, useSyncExternalStore } from "react";
import { useAccount } from "wagmi";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CONTRACTS } from "@/contracts/addresses";
import {
  useApproveIDRX,
  useCloseVault,
  useCreateVault,
  useHasRole,
  useIDRXBalance,
  usePauseVault,
  useProtocolFill,
  useSendPayout,
  useTxState,
  useVaultParameters,
  useVaultPaused,
  useVaultState,
  useVaultTotals,
} from "@/lib/contracts";
import { getErrorMessage } from "@/lib/safe";
import {
  formatDate,
  formatDuration,
  formatIDRX,
  formatTokenAmount,
  parseTokenAmount,
  toDisplayNumber,
} from "@/lib/formatters";
import { PageHeader } from "@/components/ui/PageHeader";
import { KeyFigures } from "@/components/ui/KeyFigures";
import { ConnectGate } from "@/components/ui/ConnectGate";
import { StepAction } from "@/components/ui/StepAction";
import { Field } from "@/components/ui/Field";
import { TxNotice } from "@/components/ui/TxNotice";
import { StateBadge } from "@/components/ui/StateBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedNumber, PageTransition, Press, Reveal } from "@/components/ui/motion";

const TICK = 15;

/** Wall-clock seconds, refreshed every TICK seconds so the maturity check turns on by itself. */
function useNowSeconds() {
  return useSyncExternalStore(
    (onChange) => {
      const id = setInterval(onChange, TICK * 1000);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / 1000 / TICK) * TICK,
    () => 0,
  );
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const { data: vaultStateRaw, isLoading: stateLoading, refetch: refetchState } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();
  const { data: idrxBal } = useIDRXBalance(address);
  const { data: paused, refetch: refetchPaused } = useVaultPaused();
  const { data: hasProtocolRole, isLoading: roleLoading } = useHasRole("PROTOCOL_ROLE", address);

  const [maxQuotaInput, setMaxQuotaInput] = useState("");
  const [durationDays, setDurationDays] = useState("180");
  const [apyBps, setApyBps] = useState("500");
  const [fillAmount, setFillAmount] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");

  const createTx = useTxState();
  const fillTx = useTxState();
  const payoutTx = useTxState();
  const closeTx = useTxState();
  const pauseTx = useTxState();

  const { createVault } = useCreateVault();
  const { protocolFill } = useProtocolFill();
  const { sendPayout } = useSendPayout();
  const { closeVault } = useCloseVault();
  const { pause, unpause } = usePauseVault();
  const { approve } = useApproveIDRX();

  const s = Number(vaultStateRaw ?? 0);
  const configured = !!params.vaultCreated.data;
  const maxQuota = toDisplayNumber(params.maxQuota.data);
  const totalAssets = toDisplayNumber(totals.totalAssets.data);
  const remaining = Math.max(0, maxQuota - totalAssets);
  const lockStart = Number(params.lockStartTime.data ?? 0n);
  const dur = Number(params.duration.data ?? 0n);
  const maturity = lockStart + dur;
  const now = useNowSeconds();
  const matured = lockStart > 0 && now >= maturity;

  function refetchAll() {
    refetchState();
    refetchPaused();
    params.maxQuota.refetch();
    params.duration.refetch();
    params.apy.refetch();
    params.lockStartTime.refetch();
    params.vaultCreated.refetch();
    totals.totalAssets.refetch();
    totals.totalSupply.refetch();
  }

  /** Runs one admin call, optionally preceded by an IDRX approval, and reports its status. */
  async function run(
    tx: ReturnType<typeof useTxState>,
    send: () => Promise<`0x${string}`>,
    approveAmount?: bigint,
  ) {
    try {
      tx.setError("");
      tx.setHash("");
      if (approveAmount !== undefined) {
        tx.setStatus("approving");
        await approve(CONTRACTS.sukukVault, approveAmount);
      }
      tx.setStatus("awaiting_signature");
      const hash = await send();
      tx.setHash(hash);
      tx.setStatus("confirmed");
      refetchAll();
    } catch (e: unknown) {
      tx.setStatus("failed");
      tx.setError(getErrorMessage(e));
    }
  }

  const busy = (tx: ReturnType<typeof useTxState>) =>
    tx.status === "approving" || tx.status === "awaiting_signature" || tx.status === "pending";

  if (!isConnected) {
    return (
      <PageTransition>
        <ConnectGate
          kicker="Protocol admin"
          title="Run the round"
          description="Controls for the wallet that holds PROTOCOL_ROLE. The role is checked on-chain before anything is shown as callable."
        />
      </PageTransition>
    );
  }

  const createAmount = parseTokenAmount(maxQuotaInput);
  const fillParsed = parseTokenAmount(fillAmount);
  const payoutParsed = parseTokenAmount(payoutAmount);

  return (
    <PageTransition>
      <div className="container pb-24">
        <PageHeader
          kicker="Protocol admin"
          title="Run the round"
          description="Every call below is gated by PROTOCOL_ROLE and by the vault's current state. The card that can act now is highlighted."
          actions={
            <Press>
              <button type="button" onClick={refetchAll} className="btn btn-ghost">
                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh state
              </button>
            </Press>
          }
        />

        {!roleLoading && !hasProtocolRole && (
          <Reveal className="mb-8 flex items-start gap-3 rounded-[20px] bg-amber-soft px-6 py-5 text-[13px] text-amber">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">This wallet does not hold PROTOCOL_ROLE.</span> The contract will
              reject every call on this page from it.
            </p>
          </Reveal>
        )}

        <Reveal delay={0.05}>
          <KeyFigures
            figures={[
              {
                label: "Vault state",
                lead: true,
                value: stateLoading ? <Skeleton className="h-6 w-28" /> : <StateBadge state={s} />,
                note: configured ? "Decides which step is callable" : "No round configured yet",
              },
              {
                label: "Subscribed",
                value: <AnimatedNumber value={totalAssets} suffix=" IDRX" />,
                note: configured ? `${formatIDRX(remaining)} IDRX of quota left` : "Set by createVault()",
              },
              {
                label: "Circuit breaker",
                value: paused ? "Paused" : "Running",
                note: paused ? "Deposits and redemptions are halted" : "Deposits and redemptions allowed",
              },
              {
                label: "Your IDRX",
                value: idrxBal !== undefined ? <AnimatedNumber value={toDisplayNumber(idrxBal)} suffix=" IDRX" /> : "Not read",
                note: "Funds protocolFill() and sendPayout()",
              },
            ]}
          />
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <StepAction
            step="01"
            title="Create the round"
            call="createVault(maxQuota, duration, apy)"
            description="Sets the quota, the lock period and the target yield. Runs once per deployment."
            requires="no round"
            current={s}
            ready={!configured}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(createTx, () =>
                  createVault(createAmount, BigInt(Math.round(Number(durationDays) * 86400)), BigInt(parseInt(apyBps || "0"))),
                );
              }}
              className="space-y-4"
            >
              <Field id="max-quota" label="Quota" unit="IDRX" value={maxQuotaInput} onChange={setMaxQuotaInput} placeholder="100000" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="duration" label="Lock period" unit="days" value={durationDays} onChange={setDurationDays} placeholder="180" />
                <Field id="apy" label="Target yield" unit="bps" value={apyBps} onChange={setApyBps} placeholder="500" hint="500 = 5%" step="1" />
              </div>
              <button type="submit" disabled={configured || createAmount <= 0n || busy(createTx)} className="btn btn-primary w-full">
                {busy(createTx) ? "Waiting for wallet…" : "Create round"}
              </button>
              <TxNotice status={createTx.status} hash={createTx.hash} error={createTx.error} />
            </form>
          </StepAction>

          <StepAction
            step="03"
            title="Top up the quota"
            call="protocolFill(amount)"
            description="Deposits protocol IDRX so the round reaches its quota. Two prompts: approve, then fill."
            requires="Open"
            current={s}
            ready={s === 0 && configured && remaining > 0}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(fillTx, () => protocolFill(fillParsed), fillParsed);
              }}
              className="space-y-4"
            >
              <Field
                id="fill"
                label="Amount"
                unit="IDRX"
                value={fillAmount}
                onChange={setFillAmount}
                hint={`${formatIDRX(remaining)} left`}
                onFill={remaining > 0 ? () => setFillAmount(formatTokenAmount(params.maxQuota.data! - (totals.totalAssets.data ?? 0n))) : undefined}
                fillLabel="Fill"
              />
              <button type="submit" disabled={s !== 0 || !configured || fillParsed <= 0n || busy(fillTx)} className="btn btn-primary w-full">
                {busy(fillTx) ? "Waiting for wallet…" : "Top up quota"}
              </button>
              <TxNotice status={fillTx.status} hash={fillTx.hash} error={fillTx.error} />
            </form>
          </StepAction>

          <StepAction
            step="05"
            title="Fund the payout"
            call="sendPayout(amount)"
            description="Pays the return into the vault after the lock period. The share price rises by exactly this amount."
            requires="Locked"
            current={s}
            ready={s === 1 && matured}
            checks={
              lockStart > 0
                ? [
                    { label: `Locked on ${formatDate(lockStart)}`, ok: true },
                    { label: `Lock period ${formatDuration(dur)} ends ${formatDate(maturity)}`, ok: matured },
                  ]
                : undefined
            }
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(payoutTx, () => sendPayout(payoutParsed), payoutParsed);
              }}
              className="space-y-4"
            >
              <Field id="payout" label="Payout" unit="IDRX" value={payoutAmount} onChange={setPayoutAmount} placeholder="5000" />
              <button type="submit" disabled={s !== 1 || payoutParsed <= 0n || busy(payoutTx)} className="btn btn-primary w-full">
                {busy(payoutTx) ? "Waiting for wallet…" : "Fund payout"}
              </button>
              <TxNotice status={payoutTx.status} hash={payoutTx.hash} error={payoutTx.error} />
            </form>
          </StepAction>

          <StepAction
            step="07"
            title="Close the round"
            call="closeVault()"
            description="Marks the round settled once redemption is open. Holders can still redeem afterwards."
            requires="Approved for payout"
            current={s}
            ready={s === 3}
          >
            <div className="space-y-4">
              <button type="button" onClick={() => run(closeTx, closeVault)} disabled={s !== 3 || busy(closeTx)} className="btn btn-primary w-full">
                {busy(closeTx) ? "Waiting for wallet…" : "Close round"}
              </button>
              <TxNotice status={closeTx.status} hash={closeTx.hash} error={closeTx.error} />
            </div>
          </StepAction>
        </div>

        <Reveal className="mt-8 flex flex-col gap-5 rounded-[24px] border border-line bg-amber-soft/60 p-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="label">Circuit breaker · pause() / unpause()</p>
            <p className="title mt-2 text-xl">{paused ? "The vault is paused" : "The vault is running"}</p>
            <p className="mt-1.5 max-w-[56ch] text-[13px] leading-relaxed text-muted-foreground">
              Pausing halts deposits, redemptions, fills and payouts until it is lifted. Use it only for an incident.
            </p>
          </div>
          <div className="w-full space-y-3 md:w-72">
            <button
              type="button"
              onClick={() => run(pauseTx, () => (paused ? unpause() : pause()))}
              disabled={busy(pauseTx)}
              className={`btn w-full ${paused ? "btn-primary" : "border-amber bg-white text-amber hover:bg-amber hover:text-white"}`}
            >
              {busy(pauseTx) ? "Waiting for wallet…" : paused ? "Unpause vault" : "Pause vault"}
            </button>
            <TxNotice status={pauseTx.status} hash={pauseTx.hash} error={pauseTx.error} />
          </div>
        </Reveal>
      </div>
    </PageTransition>
  );
}
