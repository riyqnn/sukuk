"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CONTRACTS } from "@/contracts/addresses";
import { useConvertToAssets, useIDRXBalance, useSukukBalance, useVaultState } from "@/lib/contracts";
import { compactAddress, formatIDRX, toDisplayNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/PageHeader";
import { KeyFigures } from "@/components/ui/KeyFigures";
import { Panel } from "@/components/ui/Panel";
import { ConnectGate } from "@/components/ui/ConnectGate";
import { Skeleton } from "@/components/ui/Skeleton";
import { AnimatedNumber, EASE, PageTransition, Press, Reveal } from "@/components/ui/motion";

const R = 64;
const CIRC = 2 * Math.PI * R;

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: sukukRaw, isLoading: sukukLoading } = useSukukBalance(address);
  const sukukBal = sukukRaw ?? 0n;
  const { data: convertedRaw, isLoading: convLoading } = useConvertToAssets(sukukBal);
  const { data: idrxRaw, isLoading: idrxLoading } = useIDRXBalance(address);
  const { data: state } = useVaultState();

  if (!isConnected) {
    return (
      <PageTransition>
        <ConnectGate
          kicker="Portfolio"
          title="Your position"
          description="Your IDRX balance, your sSUKUK shares, and what those shares are worth at today's share price."
        />
      </PageTransition>
    );
  }

  const idrx = toDisplayNumber(idrxRaw);
  const shares = toDisplayNumber(sukukBal);
  const value = toDisplayNumber(convertedRaw);
  const total = idrx + value;
  const vaultShare = total > 0 ? value / total : 0;
  const redeemable = state === 3 || state === 4;
  const loading = idrxLoading || convLoading;

  return (
    <PageTransition>
      <div className="container pb-24">
        <PageHeader
          kicker="Portfolio"
          title="Your position"
          description="Shares are valued with the vault's own convertToAssets(), so the figure matches what a redemption pays."
          aside={
            <a
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[13px] text-muted-foreground hover:text-forest"
            >
              {address ? compactAddress(address) : ""} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          }
          actions={
            <Press>
              <Link href="/sukuk" className="btn btn-primary">
                {redeemable ? "Redeem shares" : "Deposit IDRX"}
                <span className="btn-icon">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </Press>
          }
        />

        <Reveal delay={0.05}>
          <KeyFigures
            figures={[
              {
                label: "Position value",
                lead: true,
                loading: convLoading,
                value: <AnimatedNumber value={value} decimals={2} suffix=" IDRX" />,
                note: "What your shares redeem for today",
              },
              { label: "sSUKUK held", loading: sukukLoading, value: <AnimatedNumber value={shares} decimals={2} />, note: "Vault shares in this wallet" },
              { label: "Wallet IDRX", loading: idrxLoading, value: <AnimatedNumber value={idrx} decimals={2} />, note: "Available to deposit" },
              { label: "Combined", loading, value: <AnimatedNumber value={total} decimals={2} />, note: "Wallet IDRX plus position value" },
            ]}
          />
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <Panel title="Allocation" description="Share of your IDRX sitting in the vault." className="lg:col-span-5" delay={0.05}>
            {total === 0 && !loading ? (
              <div className="rounded-2xl bg-mist px-5 py-8 text-center">
                <p className="font-semibold">Nothing here yet</p>
                <p className="mx-auto mt-1.5 max-w-[30ch] text-[13px] text-muted-foreground">
                  This wallet holds no IDRX and no sSUKUK on Sepolia.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-7 sm:flex-row lg:flex-col xl:flex-row">
                <div className="relative h-44 w-44 shrink-0">
                  <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" aria-hidden="true">
                    <circle cx="80" cy="80" r={R} fill="none" stroke="#e3f3ea" strokeWidth="16" />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r={R}
                      fill="none"
                      stroke="#16603f"
                      strokeWidth="16"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      initial={{ strokeDashoffset: CIRC }}
                      whileInView={{ strokeDashoffset: CIRC * (1 - Math.max(vaultShare, 0.002)) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, ease: EASE }}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="figure text-2xl font-medium leading-none">{(vaultShare * 100).toFixed(1)}%</p>
                      <p className="mt-1 text-xs text-muted-foreground">in the vault</p>
                    </div>
                  </div>
                </div>
                <ul className="w-full space-y-2.5 text-[13px]">
                  <li className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-forest" aria-hidden="true" /> In the vault
                    </span>
                    <span className="figure">{formatIDRX(value)}</span>
                  </li>
                  <li className="flex items-center justify-between rounded-xl bg-mist px-4 py-3">
                    <span className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-mint-2 ring-1 ring-mint-3" aria-hidden="true" /> In the wallet
                    </span>
                    <span className="figure">{formatIDRX(idrx)}</span>
                  </li>
                </ul>
              </div>
            )}
          </Panel>

          <Panel title="Holdings" description="Balances read from each contract." className="lg:col-span-7" delay={0.1} bodyClassName="p-0">
            <ul className="hairline">
              {[
                {
                  name: "sSUKUK",
                  kind: "ERC-4626 vault share",
                  address: CONTRACTS.sukukVault,
                  amount: loading || sukukLoading ? null : `${formatIDRX(shares)} sSUKUK`,
                  worth: convLoading ? null : `${formatIDRX(value)} IDRX`,
                  tag: redeemable ? "Redeemable now" : "Locked in round",
                  tagTone: redeemable ? "bg-mint text-forest-deep" : "bg-amber-soft text-amber",
                },
                {
                  name: "MockIDRX",
                  kind: "Testnet underlying token",
                  address: CONTRACTS.idrx,
                  amount: idrxLoading ? null : `${formatIDRX(idrx)} IDRX`,
                  worth: idrxLoading ? null : `${formatIDRX(idrx)} IDRX`,
                  tag: "In wallet",
                  tagTone: "bg-mist text-muted-foreground",
                },
              ].map((h) => (
                <li key={h.name} className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="text-[15px] font-semibold">{h.name}</p>
                      <span className={`chip ${h.tagTone}`}>{h.tag}</span>
                    </div>
                    <a
                      href={`https://sepolia.etherscan.io/address/${h.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-forest"
                    >
                      {h.kind} · <span className="font-mono">{compactAddress(h.address)}</span>
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="figure text-[15px]">{h.amount ?? <Skeleton className="h-5 w-24" />}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Worth {h.worth ?? "…"}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </PageTransition>
  );
}
