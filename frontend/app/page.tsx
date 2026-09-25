"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { ADDRESSES, CONTRACTS } from "@/contracts/addresses";
import { useSafePolicy, useVaultParameters, useVaultState, useVaultTotals } from "@/lib/contracts";
import {
  basisPointsToPercent,
  compactAddress,
  formatDuration,
  formatIDRX,
  stateLabel,
  toDisplayNumber,
} from "@/lib/formatters";
import { VaultRing } from "@/components/ui/VaultRing";
import { StateBadge } from "@/components/ui/StateBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  AnimatedNumber,
  EASE,
  LineReveal,
  Mark,
  PageTransition,
  Parallax,
  Press,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/ui/motion";

const STEPS = [
  {
    name: "Open",
    actor: "Investors",
    call: "deposit(assets, receiver)",
    text: "The round accepts IDRX until the quota is full. Every deposit mints sSUKUK shares at the current share price.",
  },
  {
    name: "Locked",
    actor: "Auditor Safe",
    call: "approveVault()",
    text: "The auditor Safe closes subscription. Deposits and redemptions both stop, and the lock period starts counting.",
  },
  {
    name: "Matured",
    actor: "Protocol",
    call: "sendPayout(amount)",
    text: "Once the lock period ends, the protocol pays the return into the vault. The share price rises by exactly that amount.",
  },
  {
    name: "Approved for payout",
    actor: "Auditor Safe",
    call: "approvePayout()",
    text: "The auditor Safe confirms the payout. From this block on, every holder can redeem.",
  },
  {
    name: "Closed",
    actor: "Protocol",
    call: "closeVault()",
    text: "The round is marked settled. Redemption stays open, so a late holder is never locked out.",
  },
];

/** What a visitor can do at each on-chain state, so the page answers "now what?". */
const NOW: Record<number, { line: string; cta: string; href: string }> = {
  0: { line: "The round is open. Deposits are being accepted.", cta: "Deposit IDRX", href: "/sukuk" },
  1: { line: "Funds are locked until maturity. Nothing moves until then.", cta: "Track the round", href: "/sukuk" },
  2: { line: "The payout is funded and waiting on the auditor Safe.", cta: "See the auditor gate", href: "/auditor" },
  3: { line: "Redemption is open. Holders can take principal plus payout.", cta: "Redeem shares", href: "/sukuk" },
  4: { line: "The round is settled. Remaining holders can still redeem.", cta: "Redeem shares", href: "/sukuk" },
};

export default function HomePage() {
  const { data: rawState, isLoading: stateLoading } = useVaultState();
  const params = useVaultParameters();
  const totals = useVaultTotals();
  const safe = useSafePolicy();
  const reduce = useReducedMotion();

  const state = rawState ?? 0;
  const configured = params.vaultCreated.data === true;
  const quota = toDisplayNumber(params.maxQuota.data);
  const raised = toDisplayNumber(totals.totalAssets.data);
  const shares = toDisplayNumber(totals.totalSupply.data);
  const filledPct = quota > 0 ? Math.min(100, (raised / quota) * 100) : 0;
  const sharePrice = shares > 0 ? raised / shares : 1;
  const loading = params.vaultCreated.isLoading || totals.totalAssets.isLoading;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScroll = useSpring(heroProgress, { stiffness: 110, damping: 24, mass: 0.4 });
  const copyY = useTransform(heroScroll, [0, 1], [0, -80]);
  const copyFade = useTransform(heroScroll, [0, 0.8], [1, 0]);
  const cardNear = useTransform(heroScroll, [0, 1], [0, -140]);
  const cardFar = useTransform(heroScroll, [0, 1], [0, -40]);

  const now = NOW[state];

  return (
    <PageTransition>
      {/* Hero: the promise on the left, the live vault on the right. */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[linear-gradient(180deg,#f5faf7_0%,#ffffff_100%)]"
        />
        <div className="container grid items-center gap-14 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-28 lg:pt-24">
          <motion.div style={reduce ? undefined : { y: copyY, opacity: copyFade }}>
            <Reveal>
              <p className="kicker">ERC-4626 Sukuk vault on Sepolia</p>
            </Reveal>
            <h1 className="display display-xl mt-6">
              <span className="sr-only">Sukuk you can verify, block by block.</span>
              <span aria-hidden="true">
                <LineReveal
                  delay={0.1}
                  lines={[
                    "Sukuk you",
                    <>
                      can <Mark>verify,</Mark>
                    </>,
                    "block by block.",
                  ]}
                />
              </span>
            </h1>
            <Reveal delay={0.35}>
              <p className="lede mt-7 max-w-[46ch]">
                Deposit IDRX, hold sSUKUK shares, and redeem principal plus the funded payout. Every
                step is a transaction you can read on Sepolia, and two of them need the auditor Safe.
              </p>
            </Reveal>
            <Reveal delay={0.45} className="mt-9 flex flex-wrap items-center gap-3">
              <Press>
                <Link href="/sukuk" className="btn btn-primary">
                  Open the vault
                  <span className="btn-icon">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </Press>
              <Press>
                <a href="#lifecycle" className="btn btn-ghost">
                  How a round works
                </a>
              </Press>
            </Reveal>
          </motion.div>

          {/* Live vault. Cards sit at two depths so the scene separates as you scroll. */}
          <Reveal delay={0.2} className="relative mx-auto w-full max-w-[540px]">
            <div className="relative aspect-square">
              <VaultRing filledPct={filledPct} state={state} configured={configured} scroll={heroScroll} />

              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="label">Share price</p>
                  <p className="figure mt-1.5 text-[clamp(1.6rem,3.4vw,2.25rem)] font-medium leading-none">
                    {loading ? <Skeleton className="h-8 w-28" /> : sharePrice.toFixed(4)}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">IDRX per sSUKUK</p>
                </div>
              </div>

              <motion.div
                style={reduce ? undefined : { y: cardNear }}
                className="absolute -left-6 top-[9%] hidden w-[210px] sm:block"
              >
                <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-[0_20px_40px_-28px_#16603f66]">
                  <p className="label">Subscribed</p>
                  <p className="figure mt-1.5 text-lg font-medium leading-none">
                    {loading ? <Skeleton className="h-5 w-20" /> : <AnimatedNumber value={raised} />}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    of {configured ? formatIDRX(quota) : "no"} IDRX quota
                  </p>
                </div>
              </motion.div>

              <motion.div
                style={reduce ? undefined : { y: cardFar }}
                className="absolute -right-6 bottom-[10%] hidden w-[220px] sm:block"
              >
                <div className="rounded-2xl border border-line bg-white/95 p-4 shadow-[0_20px_40px_-28px_#16603f66]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="label">Vault state</p>
                  </div>
                  <div className="mt-2">{stateLoading ? <Skeleton className="h-6 w-24" /> : <StateBadge state={state} />}</div>
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    Target yield {basisPointsToPercent(Number(params.apy.data ?? 0n))} · lock{" "}
                    {formatDuration(Number(params.duration.data ?? 0n))}
                  </p>
                </div>
              </motion.div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
              <div className="rounded-2xl border border-line bg-white p-4">
                <dt className="label">Subscribed</dt>
                <dd className="figure mt-1.5 text-lg font-medium leading-none">{formatIDRX(raised)}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">of {configured ? formatIDRX(quota) : "no"} IDRX</dd>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <dt className="label">Target yield</dt>
                <dd className="figure mt-1.5 text-lg font-medium leading-none">{basisPointsToPercent(Number(params.apy.data ?? 0n))}</dd>
                <dd className="mt-1 text-xs text-muted-foreground">lock {formatDuration(Number(params.duration.data ?? 0n))}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Right-now band: the one action the current state allows. */}
      <section className="border-y border-line bg-mist">
        <div className="container flex flex-col gap-5 py-7 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className="label">Right now</span>
            {stateLoading ? <Skeleton className="h-6 w-28" /> : <StateBadge state={state} />}
            <p className="text-[15px] font-medium">
              {configured ? now.line : "No round has been configured on this deployment yet."}
            </p>
          </div>
          {configured && (
            <Link href={now.href} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-forest-deep">
              {now.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <Lifecycle state={state} configured={configured} />

      {/* Roles: who can move the round, and what each key is allowed to call. */}
      <section className="container py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="kicker">Roles and keys</p>
            <h2 className="display display-lg mt-5">
              Three roles. <Mark>No shortcuts</Mark> between them.
            </h2>
            <p className="lede mt-7 max-w-[42ch]">
              AUDITOR_ROLE administers itself, so the protocol admin cannot grant it to its own key.
              The gates that lock funds and release them belong to the Safe.
            </p>
          </Reveal>

          <Stagger className="grid gap-4 sm:grid-cols-2" gap={0.1}>
            <StaggerItem className="sm:col-span-2">
              <div className="panel lift p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="label">Auditor Safe · AUDITOR_ROLE</p>
                    <p className="title mt-2 text-2xl">Locks the round and releases the payout</p>
                  </div>
                  <span className="chip bg-pistachio text-forest-deep">
                    {safe.isLoading
                      ? "Reading policy…"
                      : safe.threshold !== undefined && safe.owners
                        ? `${safe.threshold}-of-${safe.owners.length} signatures`
                        : "Policy unavailable"}
                  </span>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
                  <code className="font-mono text-[13px] text-muted-foreground">approveVault() · approvePayout()</code>
                  <a
                    href={`https://app.safe.global/home?safe=sep:${ADDRESSES.auditorMultisig}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-forest hover:underline"
                  >
                    {compactAddress(ADDRESSES.auditorMultisig)} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="panel-mist lift h-full p-7">
                <p className="label">Protocol · PROTOCOL_ROLE</p>
                <p className="title mt-2 text-xl">Runs the round</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Creates it, tops up the quota, funds the payout, closes it, and can pause.
                </p>
                <ul className="mt-6 space-y-1.5">
                  {ADDRESSES.protocolAdmins.map((a) => (
                    <li key={a}>
                      <a
                        href={`https://sepolia.etherscan.io/address/${a}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-[13px] font-medium text-forest hover:underline"
                      >
                        {compactAddress(a)} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="panel-mist lift h-full p-7">
                <p className="label">Investors · no role needed</p>
                <p className="title mt-2 text-xl">Deposit and redeem</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Any wallet can deposit while the round is open and redeem once the payout is approved.
                </p>
                <Link href="/portfolio" className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-semibold text-forest hover:underline">
                  See your position <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* Closing band: the contracts, and the way in. */}
      <section className="container pb-24 lg:pb-32">
        <Reveal className="relative overflow-hidden rounded-[28px] bg-mint px-7 py-14 sm:px-12 lg:px-16 lg:py-20">
          <Parallax distance={40} className="pointer-events-none absolute -right-24 -top-24 hidden w-[420px] opacity-70 md:block">
            <svg viewBox="0 0 400 400" aria-hidden="true">
              {[180, 150, 120, 90].map((r) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#8fc4a6" strokeWidth="1" strokeDasharray={r === 150 ? "2 6" : undefined} />
              ))}
            </svg>
          </Parallax>

          <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h2 className="display display-lg max-w-[16ch]">Every figure here is read from Sepolia.</h2>
              <p className="mt-5 max-w-[44ch] text-[15px] leading-relaxed text-forest-deep">
                Nothing on this site is typed in by hand. Check the vault and the token yourself, then
                connect a wallet when you are ready.
              </p>
              <Press className="mt-8">
                <Link href="/sukuk" className="btn btn-primary">
                  Deposit into the vault
                  <span className="btn-icon">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </Press>
            </div>

            <ul className="space-y-3">
              {[
                { name: "SukukVault", spec: "ERC-4626 vault, sSUKUK shares", address: CONTRACTS.sukukVault },
                { name: "MockIDRX", spec: "Testnet underlying, 18 decimals", address: CONTRACTS.idrx },
              ].map((c) => (
                <li key={c.address}>
                  <a
                    href={`https://sepolia.etherscan.io/address/${c.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 transition-transform duration-500 [transition-timing-function:var(--ease)] hover:-translate-y-0.5"
                  >
                    <span>
                      <span className="block text-[15px] font-semibold">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">{c.spec}</span>
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground group-hover:text-forest">
                      {compactAddress(c.address)}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}

/**
 * Pinned walkthrough of the five states. The left column stays put while the steps
 * scroll past; the step nearest the middle of the screen becomes the active one.
 */
function Lifecycle({ state, configured }: { state: number; configured: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start center", "end center"] });
  const rail = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(p * STEPS.length))));
  });

  return (
    <section id="lifecycle" className="scroll-mt-24 border-b border-line">
      <div ref={ref} className="container grid gap-12 py-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:py-32">
        <div className="lg:sticky lg:top-28 lg:h-fit">
          <Reveal>
            <p className="kicker">How a round works</p>
            <h2 className="display display-lg mt-5">
              Five states, <Mark>one direction.</Mark>
            </h2>
            <p className="lede mt-7 max-w-[40ch]">
              SukukVault only moves forward. Each step is a separate transaction from a separate role.
            </p>
          </Reveal>

          <div className="relative mt-10 hidden lg:block">
            <div className="absolute bottom-3 left-[9px] top-3 w-px bg-line" aria-hidden="true" />
            <motion.div
              className="absolute left-[9px] top-3 w-px origin-top bg-forest"
              style={{ scaleY: rail, height: "calc(100% - 24px)" }}
              aria-hidden="true"
            />
            <ol className="relative space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.name} className="flex items-center gap-4">
                  <span
                    className={`grid h-[19px] w-[19px] place-items-center rounded-full border transition-colors duration-500 ${
                      i <= active ? "border-forest bg-forest" : "border-line-strong bg-white"
                    }`}
                    aria-hidden="true"
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${i <= active ? "bg-white" : "bg-transparent"}`} />
                  </span>
                  <span className={`text-sm transition-colors duration-500 ${i === active ? "font-semibold text-ink" : "text-muted-foreground"}`}>
                    {s.name}
                  </span>
                  {configured && i === state && <span className="chip bg-pistachio text-forest-deep">Live now</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ol className="space-y-5 lg:space-y-[18vh] lg:py-[8vh]">
          {STEPS.map((s, i) => (
            <li key={s.name}>
              <StepCard step={s} index={i} active={i === active} live={configured && i === state} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  active,
  live,
}: {
  step: (typeof STEPS)[number];
  index: number;
  active: boolean;
  live: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease: EASE }}
      className={`rounded-[24px] border p-7 transition-[border-color,background-color,box-shadow] duration-500 sm:p-9 ${
        active
          ? "border-mint-3 bg-white shadow-[0_28px_60px_-40px_#16603f80]"
          : "border-line bg-mist lg:bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="figure text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")} / 05</span>
        <AnimatePresence>
          {live && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="chip bg-pistachio text-forest-deep"
            >
              Live on-chain · {stateLabel(index)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <h3 className="title mt-5 text-[1.75rem] leading-tight">{step.name}</h3>
      <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">{step.text}</p>
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[13px]">
        <span>
          <span className="text-muted-foreground">Called by </span>
          <span className="font-semibold">{step.actor}</span>
        </span>
        <code className="font-mono text-forest">{step.call}</code>
      </div>
    </motion.article>
  );
}
