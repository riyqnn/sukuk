"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { ADDRESSES, CONTRACTS } from "@/contracts/addresses";
import { useSafePolicy } from "@/lib/contracts";
import { compactAddress } from "@/lib/formatters";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { EASE, PageTransition, Press, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

const LANES = ["Protocol", "Investors", "Auditor Safe"] as const;

const CALLS: { n: number; lane: (typeof LANES)[number]; call: string; effect: string; to?: string }[] = [
  { n: 1, lane: "Protocol", call: "createVault()", effect: "Sets quota, lock period and target yield", to: "Open" },
  { n: 2, lane: "Investors", call: "deposit()", effect: "IDRX in, sSUKUK shares minted" },
  { n: 3, lane: "Protocol", call: "protocolFill()", effect: "Optional top-up of the remaining quota" },
  { n: 4, lane: "Auditor Safe", call: "approveVault()", effect: "Closes subscription, starts the lock", to: "Locked" },
  { n: 5, lane: "Protocol", call: "sendPayout()", effect: "Pays the return in after the lock ends", to: "Matured" },
  { n: 6, lane: "Auditor Safe", call: "approvePayout()", effect: "Opens redemption", to: "Approved" },
  { n: 7, lane: "Investors", call: "redeem()", effect: "Shares burned, IDRX paid out" },
];

export default function ProtocolPage() {
  const safe = useSafePolicy();

  return (
    <PageTransition>
      <div className="container pb-24">
        <PageHeader
          kicker="Protocol"
          title="How SukukVault is wired"
          description="Seven calls take a round from creation to redemption. Each one is gated to a single role, enforced by the contract."
          actions={
            <Press>
              <Link href="/auditor" className="btn btn-ghost">
                Auditor portal
                <span className="btn-icon">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </Link>
            </Press>
          }
        />

        {/* Swimlane: one row per role, one column per call, read left to right. */}
        <Panel title="The seven calls, by role" description="Calls that change the vault state are marked with the state they lead to." bodyClassName="p-0">
          <div className="hidden lg:block">
            <div className="grid grid-cols-[150px_repeat(7,1fr)] border-b border-line bg-mist text-xs text-muted-foreground">
              <div className="px-5 py-3">Role</div>
              {CALLS.map((c) => (
                <div key={c.n} className="figure border-l border-line px-3 py-3 text-center">
                  {String(c.n).padStart(2, "0")}
                </div>
              ))}
            </div>
            {LANES.map((lane, li) => (
              <div key={lane} className={`grid grid-cols-[150px_repeat(7,1fr)] ${li > 0 ? "border-t border-line" : ""}`}>
                <div className="flex items-center px-5 py-6 text-[13px] font-semibold">{lane}</div>
                {CALLS.map((c) => (
                  <div key={c.n} className="relative border-l border-line px-2 py-4">
                    {c.lane === lane && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: c.n * 0.07, ease: EASE }}
                        className="h-full rounded-xl bg-mint px-3 py-3"
                      >
                        <code className="block font-mono text-[12px] font-medium text-forest-deep">{c.call}</code>
                        <p className="mt-1.5 text-[12px] leading-snug text-forest-deep/80">{c.effect}</p>
                        {c.to && <span className="chip mt-2 h-6 bg-white px-2 text-[11px] text-forest-deep">to {c.to}</span>}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <ol className="hairline lg:hidden">
            {CALLS.map((c) => (
              <li key={c.n} className="flex gap-4 px-6 py-5">
                <span className="figure mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mint text-xs text-forest-deep">
                  {c.n}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="font-mono text-[13px] font-medium">{c.call}</code>
                    {c.to && <span className="chip h-6 bg-mint text-[11px] text-forest-deep">to {c.to}</span>}
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {c.lane} · {c.effect}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <Stagger className="mt-8 grid gap-8 lg:grid-cols-2" gap={0.1}>
          <StaggerItem>
            <div className="panel h-full p-7">
              <p className="label">PROTOCOL_ROLE</p>
              <h2 className="title mt-2 text-2xl">Protocol admin</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Creates the round, tops up the quota, funds the payout, closes the round, and can pause
                deposits and redemptions. It cannot lock funds or release the payout.
              </p>
              <dl className="mt-6 space-y-3 text-[13px]">
                <Row label={ADDRESSES.protocolAdmins.length > 1 ? "Holders" : "Holder"}>
                  <span className="flex flex-col items-end gap-1">
                    {ADDRESSES.protocolAdmins.map((a) => (
                      <AddressLink key={a} href={`https://sepolia.etherscan.io/address/${a}`} value={a} />
                    ))}
                  </span>
                </Row>
                <Row label="Can call">
                  <span className="font-mono">createVault · protocolFill · sendPayout · closeVault · pause</span>
                </Row>
              </dl>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="panel-mist h-full p-7">
              <p className="label">AUDITOR_ROLE</p>
              <h2 className="title mt-2 text-2xl">Auditor Safe</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                The only key that can lock a round and release its payout. The role administers itself,
                so the protocol admin cannot grant it.
              </p>
              <dl className="mt-6 space-y-3 text-[13px]">
                <Row label="Safe">
                  <AddressLink href={`https://app.safe.global/home?safe=sep:${ADDRESSES.auditorMultisig}`} value={ADDRESSES.auditorMultisig} />
                </Row>
                <Row label="Signing policy">
                  {safe.isLoading ? (
                    <Skeleton className="h-5 w-24" />
                  ) : safe.threshold !== undefined && safe.owners ? (
                    <span className="chip bg-pistachio text-forest-deep">
                      {safe.threshold.toString()} of {safe.owners.length} owners
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Could not read the Safe</span>
                  )}
                </Row>
                {safe.owners && (
                  <Row label="Owners">
                    <span className="flex flex-col items-end gap-1">
                      {safe.owners.map((o) => (
                        <AddressLink key={o} href={`https://sepolia.etherscan.io/address/${o}`} value={o} />
                      ))}
                    </span>
                  </Row>
                )}
              </dl>
            </div>
          </StaggerItem>
        </Stagger>

        <Panel title="Deployed contracts" description="Ethereum Sepolia, chain ID 11155111." className="mt-8" bodyClassName="p-0" delay={0.05}>
          <ul className="hairline">
            {[
              { name: "SukukVault", spec: "ERC-4626 vault. Issues sSUKUK shares.", address: CONTRACTS.sukukVault },
              { name: "MockIDRX", spec: "ERC-20, 18 decimals. Testnet only, not the official IDRX.", address: CONTRACTS.idrx },
            ].map((c) => (
              <li key={c.address} className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[15px] font-semibold">{c.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">{c.spec}</p>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/address/${c.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 break-all font-mono text-xs text-muted-foreground hover:text-forest"
                >
                  {c.address} <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </Panel>

        <Reveal className="mt-8 rounded-[24px] bg-amber-soft px-7 py-6 text-[13px] leading-relaxed text-amber">
          <p className="font-semibold">What the contract does not check</p>
          <p className="mt-1 max-w-[80ch]">
            SukukVault does not verify that a real-world asset backs the round, or that the payout matches the
            target yield. Those checks are made off-chain by the Safe owners before they sign.
          </p>
        </Reveal>
      </div>
    </PageTransition>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-line pt-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

function AddressLink({ href, value }: { href: string; value: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono font-medium text-forest hover:underline">
      {compactAddress(value)} <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}
