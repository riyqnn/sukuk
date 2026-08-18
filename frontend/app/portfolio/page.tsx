"use client";

import { useAccount } from "wagmi";
import { useSukukBalance, useConvertToAssets, useIDRXBalance } from "@/lib/contracts";
import { formatIDRX } from "@/lib/formatters";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { Wallet, PieChart, Layers, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  AnimatedNumber,
  TiltCard,
  MagneticButton,
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/ui/motion";
import { motion } from "framer-motion";

export default function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: sukukBalRaw, isLoading: sukukLoading } = useSukukBalance(address);
  const sukukBal = (sukukBalRaw as bigint | undefined) ?? 0n;
  const { data: convertedRaw, isLoading: convLoading } = useConvertToAssets(sukukBal as bigint | undefined);
  const converted = (convertedRaw as bigint | undefined) ?? 0n;
  const { data: idrxBalRaw, isLoading: idrxLoading } = useIDRXBalance(address);
  const idrxBal = (idrxBalRaw as bigint | undefined) ?? 0n;

  const idrxVal = Number(idrxBal) / 1e18;
  const sukukVal = Number(converted) / 1e18;
  const totalNetWorth = idrxVal + sukukVal;

  const idrxPct = totalNetWorth > 0 ? (idrxVal / totalNetWorth) * 100 : 50;
  const sukukPct = totalNetWorth > 0 ? (sukukVal / totalNetWorth) * 100 : 50;

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="container py-24 flex items-center justify-center min-h-[65vh]">
          <TiltCard maxTilt={8} className="max-w-md w-full">
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-ring">
                <Wallet className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Connect Your Wallet</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your Ethereum wallet to inspect your IDRX balance, active sSUKUK share holdings, and yield positions.
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <WalletConnect />
              </div>
            </div>
          </TiltCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container py-12 space-y-10">
        {/* Header & Overview */}
        <FadeIn direction="down" className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-line" />
              <span>01 &middot; INVESTMENT COMMAND CENTER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Portfolio Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
              CONNECTED ACCOUNT: {address}
            </p>
          </div>

          <MagneticButton>
            <Link href="/sukuk" className="button">
              <span>Deposit IDRX to Vault</span>
              <span className="button-arrow">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </MagneticButton>
        </FadeIn>

        {/* 3D Bento Metrics Grid */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" staggerDelay={0.07}>
          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Liquid IDRX Balance
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {idrxLoading ? "..." : <AnimatedNumber value={idrxVal} suffix=" IDRX" decimals={0} />}
                </div>
                <p className="text-xs text-muted-foreground">Available for vault deposits</p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  sSUKUK Token Shares
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {sukukLoading ? "..." : <AnimatedNumber value={Number(sukukBal) / 1e18} suffix=" shares" decimals={0} />}
                </div>
                <p className="text-xs text-muted-foreground">ERC-4626 Vault Shares held</p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Underlying Portfolio Value
                </span>
                <div className="text-2xl font-bold tracking-tight text-ring font-mono">
                  {convLoading ? "..." : <AnimatedNumber value={sukukVal} suffix=" IDRX" decimals={0} />}
                </div>
                <p className="text-xs text-muted-foreground">Redeemable asset parity</p>
              </div>
            </TiltCard>
          </StaggerItem>

          <StaggerItem>
            <TiltCard maxTilt={5}>
              <div className="bg-card border border-border rounded-xl p-5 space-y-2 shadow-2xs">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">
                  Total Portfolio Valuation
                </span>
                <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  <AnimatedNumber value={totalNetWorth} suffix=" IDRX" decimals={0} />
                </div>
                <p className="text-xs text-muted-foreground">Combined liquid + yield positions</p>
              </div>
            </TiltCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Asset Allocation & Holdings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SVG Donut Visualizer */}
          <FadeIn direction="right" className="lg:col-span-5 bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-ring" />
              Asset Allocation Visualizer
            </h2>

            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-secondary stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${idrxPct}, 100` }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    className="text-ring stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-mono font-semibold text-muted-foreground">Total</span>
                  <span className="text-base font-mono font-bold text-foreground">{formatIDRX(totalNetWorth * 1e18)}</span>
                </div>
              </div>

              <div className="w-full space-y-2 font-mono text-xs pt-2">
                <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/60">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-ring" /> Liquid IDRX
                  </span>
                  <span className="font-bold">{idrxPct.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-secondary/60">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> sSUKUK Vault
                  </span>
                  <span className="font-bold">{sukukPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Detailed Holdings Table */}
          <FadeIn direction="left" className="lg:col-span-7 bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-ring" /> Active Asset Positions
              </h2>
              <span className="text-[0.6875rem] font-mono text-muted-foreground">SEPOLIA TESTNET</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Share Balance</th>
                    <th className="px-6 py-3">Underlying Value</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      IDRX Stablecoin
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">Underlying Capital</td>
                    <td className="px-6 py-4 font-mono font-bold">{idrxLoading ? "..." : formatIDRX(idrxBal)}</td>
                    <td className="px-6 py-4 font-mono font-bold">{idrxLoading ? "..." : `${formatIDRX(idrxBal)} IDRX`}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[0.625rem] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/30">
                        Liquid
                      </span>
                    </td>
                  </motion.tr>

                  <motion.tr
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-foreground flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-ring animate-pulse" />
                      sSUKUK Shares
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-mono">ERC-4626 Token</td>
                    <td className="px-6 py-4 font-mono font-bold">{sukukLoading ? "..." : formatIDRX(sukukBal)}</td>
                    <td className="px-6 py-4 font-mono font-bold">{convLoading ? "..." : `${formatIDRX(converted)} IDRX`}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[0.625rem] font-bold bg-ring/10 text-ring border border-ring/30">
                        Yield-Bearing
                      </span>
                    </td>
                  </motion.tr>
                </tbody>
              </table>
            </div>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}