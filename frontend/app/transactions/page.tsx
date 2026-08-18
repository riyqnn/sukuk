"use client";

import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { Receipt, History, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  TiltCard,
  MagneticButton,
  PageTransition,
  FadeIn,
} from "@/components/ui/motion";

export default function TransactionsPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <PageTransition>
        <div className="container py-24 flex items-center justify-center min-h-[65vh]">
          <TiltCard maxTilt={8} className="max-w-md w-full">
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-5 shadow-xl">
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-ring">
                <Receipt className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">Connect Wallet</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Connect your Ethereum wallet to inspect on-chain vault transaction history and contract interactions.
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
        <FadeIn direction="down" className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="eyebrow mb-2">
              <span className="eyebrow-line" />
              <span>01 &middot; ON-CHAIN AUDIT TRAIL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Transaction Activity Ledger
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-mono">
              LIVE SEPOLIA TESTNET LOGS & EVENTS
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

        {/* Ledger Table */}
        <FadeIn direction="up" delay={0.1} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-ring" /> On-Chain Vault Ledger
            </h2>
            <span className="text-[0.6875rem] font-mono text-muted-foreground">REAL-TIME INDEXING</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Event Type</th>
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="py-16 text-center text-xs text-muted-foreground bg-card">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                      <p className="font-bold text-foreground text-sm">No Recent On-Chain Activity</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Interact with the Sukuk Vault terminal by subscribing IDRX or redeeming sSUKUK shares to generate verified on-chain entries.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </FadeIn>

        <p className="text-xs text-muted-foreground font-mono text-center">
          Note: Transaction indexing is queried live from Sepolia testnet EVM contract logs (Chain ID: 11155111).
        </p>
      </div>
    </PageTransition>
  );
}