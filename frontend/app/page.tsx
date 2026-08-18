"use client";

import Link from "next/link";
import { CONTRACTS, ADDRESSES } from "@/contracts/addresses";
import { compactAddress } from "@/lib/formatters";
import { ShieldCheck, ArrowRight, Lock, ChevronRight, FileCheck } from "lucide-react";
import {
  TiltCard,
  MagneticButton,
  CursorSpotlight,
  PageTransition,
  FadeIn,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  PulseGlowBadge,
} from "@/components/ui/motion";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <PageTransition>
      <div className="space-y-0 pb-0">
        {/* ── 1. Hero Section ────────────────────────────────────────────── */}
        <section className="container hero">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-copy"
          >
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>01 &middot; DEFI INFRASTRUCTURE</span>
            </div>

            <h1>
              Capital, <br />
              <em className="text-ring font-serif italic">structured</em> <br />
              with purpose.
            </h1>

            <p className="hero-intro">
              A transparent infrastructure for issuing, managing, and settling tokenized Sukuk &mdash; programmable fixed-income assets built on Ethereum Sepolia.
            </p>

            <div className="hero-actions">
              <MagneticButton>
                <Link href="/sukuk" className="button shadow-lg">
                  <span>Launch Sukuk Vault</span>
                  <span className="button-arrow">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link href="/protocol" className="button button-secondary">
                  <span>Protocol Specs</span>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>

          {/* 3D Isometric Orbital Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hero-art"
          >
            <TiltCard maxTilt={12} scale={1.03} className="w-full flex justify-center">
              <div className="orbital-wrap">
                <div className="orbital-halo" />
                <div className="halo-two" />

                <div className="orbital-ring" />
                <div className="orbital-ring ring-two" />
                <div className="orbital-ring ring-three" />

                <div className="orbital-core">
                  <div className="core-front">
                    <span>SKK</span>
                  </div>
                  <div className="core-top" />
                  <div className="core-side" />
                </div>

                <div className="orbit-dot dot-one" />
                <div className="orbit-dot dot-two animate-ping" />
                <div className="orbit-dot dot-three" />

                <div className="visual-label label-top">
                  <span className="status-dot animate-pulse" />
                  <span>Vault State: OPEN</span>
                </div>

                <div className="visual-label label-bottom font-mono">
                  <span>APY: 5.00%</span>
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </section>

        {/* ── 2. Infinite Ticker Marquee ──────────────────────────────────── */}
        <section className="ticker border-y border-border py-2 bg-secondary/30">
          <div className="ticker-inner font-mono text-xs font-semibold">
            <span>ERC-4626 VAULT STANDARD</span>
            <span>&bull;</span>
            <span>SAFE MULTI-SIG ORACLE (2-OF-3)</span>
            <span>&bull;</span>
            <span>IDRX STABLECOIN SETTLEMENT</span>
            <span>&bull;</span>
            <span>SHARIAH COMPLIANT AUDIT TRAIL</span>
            <span>&bull;</span>
            <span>PROGRAMMATIC YIELD ACCRUAL</span>
            <span>&bull;</span>
            <span>ON-CHAIN VERIFIABILITY</span>
            <span>&bull;</span>
            <span>ERC-4626 VAULT STANDARD</span>
            <span>&bull;</span>
            <span>SAFE MULTI-SIG ORACLE (2-OF-3)</span>
          </div>
        </section>

        {/* ── 3. Narrative Storytelling Arc ──────────────────────────────── */}
        <ScrollReveal className="container section-pad narrative">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>02 &middot; ARCHITECTURE NARRATIVE</span>
          </div>

          <h2>
            Institutions need <span>transparency</span>,<br />
            not opaque promises.
          </h2>

          <div className="narrative-grid">
            <FadeIn direction="up" delay={0.1} className="narrative-lead">
              <p>
                Traditional Sukuk issuance suffers from delayed settlement, opaque custodial records, and high legal overhead. Sukuk protocol digitizes the entire lifecycle on Ethereum.
              </p>

              <Link href="/protocol" className="text-link group">
                <span>Explore 7-Step Vault Lifecycle</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </FadeIn>

            <StaggerContainer className="principles-list" staggerDelay={0.1}>
              <StaggerItem className="principle group">
                <span className="principle-number font-mono">01</span>
                <div>
                  <h3>Tokenized Subscription</h3>
                  <p>Investors deposit IDRX stablecoins to mint yield-bearing Sukuk Vault Shares (ERC-4626).</p>
                </div>
                <ChevronRight className="principle-arrow group-hover:translate-x-1 transition-transform text-ring" />
              </StaggerItem>

              <StaggerItem className="principle group">
                <span className="principle-number font-mono">02</span>
                <div>
                  <h3>Custodial RWA Audit</h3>
                  <p>Safe Multi-Sig Oracle verifies underlying physical Sukuk asset backing before locking funds.</p>
                </div>
                <ChevronRight className="principle-arrow group-hover:translate-x-1 transition-transform text-ring" />
              </StaggerItem>

              <StaggerItem className="principle group">
                <span className="principle-number font-mono">03</span>
                <div>
                  <h3>Automated Yield Payout</h3>
                  <p>At maturity, yield funds are injected, automatically boosting share exchange rate parity.</p>
                </div>
                <ChevronRight className="principle-arrow group-hover:translate-x-1 transition-transform text-ring" />
              </StaggerItem>

              <StaggerItem className="principle group">
                <span className="principle-number font-mono">04</span>
                <div>
                  <h3>Instant Share Redemption</h3>
                  <p>Token holders redeem shares for IDRX principal plus accrued yield with zero friction.</p>
                </div>
                <ChevronRight className="principle-arrow group-hover:translate-x-1 transition-transform text-ring" />
              </StaggerItem>
            </StaggerContainer>
          </div>
        </ScrollReveal>

        {/* ── 4. Protocol Architecture Section ───────────────────────────── */}
        <section className="protocol-section">
          <CursorSpotlight className="w-full" contentClassName="container protocol-grid">
            <FadeIn direction="right" className="protocol-copy">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span>03 &middot; SYSTEM ORCHESTRATION</span>
              </div>

              <h2>
                Two-Layer <br />
                Governance & <br />
                Oracle Protection
              </h2>

              <p>
                Separation of powers enforces institutional integrity. The Protocol Admin executes operational steps, while the Safe Multi-Sig Oracle (2-of-3 compliance threshold) approves locking and payouts.
              </p>

              <MagneticButton className="mt-8">
                <Link href="/auditor" className="button">
                  <span>Buka Auditor Portal</span>
                  <span className="button-arrow">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </MagneticButton>
            </FadeIn>

            {/* Interactive Protocol Network Diagram */}
            <ScrollReveal className="protocol-diagram">
              <div className="diagram-scan" />
              <div className="diagram-lines">
                <span />
                <span />
                <span />
                <span />
              </div>

              <div className="diagram-node node-main">
                <div className="brand-mark">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <strong>SUKUK</strong>
                <small className="font-mono">ERC-4626</small>
              </div>

              <div className="diagram-node node-a font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>ADMIN: {compactAddress(ADDRESSES.protocolAdmin)}</span>
              </div>

              <div className="diagram-node node-b font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>SAFE: 2-of-3 MULTISIG</span>
              </div>

              <div className="diagram-node node-c font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>IDRX: STABLECOIN</span>
              </div>

              <div className="diagram-caption font-mono">
                STATUS: <span>ACTIVE ON SEPOLIA TESTNET</span>
              </div>
            </ScrollReveal>
          </CursorSpotlight>
        </section>

        {/* ── 5. Bento Grid — Trust & Security ───────────────────────────── */}
        <section className="container section-pad">
          <FadeIn direction="up" className="trust-heading">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>04 &middot; SECURITY & COMPLIANCE</span>
            </div>

            <h2>
              Institutional <i>Trust</i>,<br />
              Hardened on-chain.
            </h2>

            <p>
              Designed to meet international Islamic finance governance standards alongside Ethereum smart contract security primitives.
            </p>
          </FadeIn>

          <StaggerContainer className="trust-grid" staggerDelay={0.12}>
            <StaggerItem className="h-full">
              <TiltCard maxTilt={6} className="h-full">
                <div className="trust-card dark-card h-full shadow-lg">
                  <span className="card-index font-mono">01 / TRUST</span>
                  <FileCheck className="w-6 h-6 text-ring" />
                  <h3>Shariah Compliance</h3>
                  <p>Underlying assets represent tangible Sukuk (RWA) ownership, backed by custodian audit evidence.</p>
                  <div className="mini-chart">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </TiltCard>
            </StaggerItem>

            <StaggerItem className="h-full">
              <TiltCard maxTilt={6} className="h-full">
                <div className="trust-card light-card h-full shadow-lg">
                  <span className="card-index font-mono">02 / AUDIT</span>
                  <ShieldCheck className="w-6 h-6 text-ring" />
                  <h3>Safe Multi-Sig Oracle</h3>
                  <p>2-of-3 multi-signature verification threshold prevents single-point administrative compromise.</p>
                </div>
              </TiltCard>
            </StaggerItem>

            <StaggerItem className="h-full">
              <TiltCard maxTilt={6} className="h-full">
                <div className="trust-card accent-card h-full shadow-lg">
                  <span className="card-index font-mono">03 / STANDARD</span>
                  <Lock className="w-6 h-6 text-ring" />
                  <h3>ERC-4626 Vault Standard</h3>
                  <p>Composable yield-bearing token standard ensuring seamless integration with Web3 protocols.</p>
                </div>
              </TiltCard>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* ── 6. Access Callout Section ──────────────────────────────────── */}
        <section className="access-section pb-24">
          <div className="container">
            <ScrollReveal>
              <div className="access-inner rounded-2xl shadow-xl glass-card">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    <span>05 &middot; GET STARTED</span>
                  </div>
                  <h2>
                    Ready to <em>explore</em><br />
                    Tokenized Sukuk?
                  </h2>
                </div>

                <div className="access-side">
                  <p>Access the digital asset terminal to view active Sepolia vaults and current APY rates.</p>
                  <MagneticButton>
                    <Link href="/sukuk" className="button shadow-lg">
                      <span>Enter Sukuk Vault</span>
                      <span className="button-arrow">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </MagneticButton>
                  <small className="font-mono block mt-3">CONTRACT: {compactAddress(CONTRACTS.sukukVault)}</small>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}