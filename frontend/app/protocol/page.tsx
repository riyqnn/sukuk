"use client";

import Link from "next/link";
import { CONTRACTS, ADDRESSES } from "@/contracts/addresses";
import { compactAddress } from "@/lib/formatters";
import { ShieldCheck, ExternalLink, ArrowRight, Cpu, Database, Network } from "lucide-react";
import {
  TiltCard,
  MagneticButton,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/ui/motion";

export default function ProtocolPage() {
  return (
    <PageTransition>
      <div className="container py-12 space-y-12">
        <FadeIn direction="down" className="space-y-3">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>01 &middot; SYSTEM SPECIFICATIONS & GOVERNANCE</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Protocol Architecture & Controls
          </h1>

          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Comprehensive breakdown of smart contract roles, Safe multi-signature oracle verification, and the complete 7-step ERC-4626 Sukuk lifecycle.
          </p>
        </FadeIn>

        {/* State Machine Diagram Section */}
        <FadeIn direction="up" delay={0.1} className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div className="space-y-1">
              <span className="text-[0.6875rem] font-bold text-ring uppercase tracking-wider bg-ring/10 border border-ring/30 px-3 py-1 rounded-full">
                ERC-4626 STATE MACHINE
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                7-Step Protocol Lifecycle Workflow
              </h2>
              <p className="text-xs text-muted-foreground">
                Deterministic state transitions enforced by Ethereum Sepolia smart contracts & Safe Multisig Oracle.
              </p>
            </div>

            <MagneticButton>
              <Link href="/auditor" className="button text-xs py-2.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Auditor Portal</span>
                <span className="button-arrow">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </MagneticButton>
          </div>

          {/* Roles Swimlane Grid */}
          <StaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6" staggerDelay={0.1}>
            {/* Admin Role */}
            <StaggerItem className="h-full">
              <TiltCard maxTilt={4} className="h-full">
                <div className="bg-secondary/40 border border-border rounded-xl p-6 space-y-4 h-full">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">1. Protocol Admin</h3>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 1: <code>createVault()</code></span>
                      <p className="text-muted-foreground font-sans">Configures quota, 180-day lock duration, and target APY. Moves state to <strong>OPEN</strong>.</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 3: <code>protocolFill()</code></span>
                      <p className="text-muted-foreground font-sans">Tops up remaining subscription quota from treasury if required.</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 5: <code>sendPayout()</code></span>
                      <p className="text-muted-foreground font-sans">Deposits IDRX principal + yield. Moves state to <strong>MATURED</strong>.</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>

            {/* Investor Role */}
            <StaggerItem className="h-full">
              <TiltCard maxTilt={4} className="h-full">
                <div className="bg-secondary/40 border border-border rounded-xl p-6 space-y-4 h-full">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">2. Investor / Subscriber</h3>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 2: <code>deposit(IDRX)</code></span>
                      <p className="text-muted-foreground font-sans">Stakes IDRX and receives minted <code>sSUKUK</code> vault shares at parity rate.</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 7: <code>redeem(sSUKUK)</code></span>
                      <p className="text-muted-foreground font-sans">Burns shares for IDRX principal + yield after auditor payout authorization.</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>

            {/* Auditor Multi-Sig Role */}
            <StaggerItem className="h-full">
              <TiltCard maxTilt={4} className="h-full">
                <div className="bg-secondary/40 border border-border rounded-xl p-6 space-y-4 h-full">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-ring animate-pulse" />
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">3. Safe Auditor Oracle</h3>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 4: <code>approveVault()</code></span>
                      <p className="text-muted-foreground font-sans">Audits RWA asset backing & locks funds. Moves state to <strong>LOCKED</strong>.</p>
                    </div>
                    <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                      <span className="font-bold text-foreground">Step 6: <code>approvePayout()</code></span>
                      <p className="text-muted-foreground font-sans">Audits yield calculation. Moves state to <strong>APPROVED_FOR_PAYOUT</strong>.</p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>
          </StaggerContainer>
        </FadeIn>

        {/* Governance & Safe Oracle Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FadeIn direction="right" delay={0.15}>
            <TiltCard maxTilt={4}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-ring" />
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Protocol Admin Governance</h2>
                </div>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground font-sans">Admin Address</span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${ADDRESSES.protocolAdmin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-ring hover:underline flex items-center gap-1"
                    >
                      {compactAddress(ADDRESSES.protocolAdmin)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground font-sans">Role Identifier</span>
                    <span className="font-bold text-foreground">PROTOCOL_ROLE</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground font-sans shrink-0">Capabilities</span>
                    <span className="font-sans text-foreground text-right">
                      Vault parameter initialization, quota top-ups, yield funding, emergency circuit breaker.
                    </span>
                  </div>
                </div>
              </div>
            </TiltCard>
          </FadeIn>

          <FadeIn direction="left" delay={0.15}>
            <TiltCard maxTilt={4}>
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-ring" />
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Auditor Multi-Sig Oracle</h2>
                </div>
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground font-sans">Safe Multisig Account</span>
                    <a
                      href={`https://app.safe.global/home?safe=sep:${ADDRESSES.auditorMultisig}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-ring hover:underline flex items-center gap-1"
                    >
                      {compactAddress(ADDRESSES.auditorMultisig)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-muted-foreground font-sans">Threshold</span>
                    <span className="font-bold text-foreground">2 of 3 Multi-Sig Signatures</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Verification Portal</span>
                    <Link href="/auditor" className="text-ring font-bold font-sans hover:underline flex items-center gap-1">
                      Safe SDK Portal <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </TiltCard>
          </FadeIn>
        </div>

        {/* Smart Contract Matrix */}
        <FadeIn direction="up" delay={0.2} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-ring" /> Deployed Contract Matrix
            </h2>
            <span className="text-[0.6875rem] font-mono text-muted-foreground">ETHEREUM SEPOLIA (CHAIN ID: 11155111)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Contract Name</th>
                  <th className="px-6 py-3">On-Chain Address</th>
                  <th className="px-6 py-3">Specification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">IDRX Stablecoin</td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACTS.idrx}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-ring hover:underline flex items-center gap-1"
                    >
                      {compactAddress(CONTRACTS.idrx)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">ERC-20 Underlying Asset Token</td>
                </tr>
                <tr className="hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">SukukVault</td>
                  <td className="px-6 py-4">
                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACTS.sukukVault}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-ring hover:underline flex items-center gap-1"
                    >
                      {compactAddress(CONTRACTS.sukukVault)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-mono">ERC-4626 Yield-Bearing Vault</td>
                </tr>
              </tbody>
            </table>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}