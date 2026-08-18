"use client";

import Link from "next/link";
import { CONTRACTS, ADDRESSES } from "@/contracts/addresses";
import { compactAddress } from "@/lib/formatters";
import { ExternalLink, ShieldCheck, ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-md mt-auto relative z-10">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <Link
              href="/"
              className="wordmark group text-foreground transition-transform duration-300 hover:scale-105 inline-flex items-center gap-2.5"
            >
              <div className="brand-mark group-hover:rotate-45 transition-transform duration-500">
                <span />
                <span />
                <span />
                <span />
              </div>
              <span className="font-bold tracking-wider text-base">SUKUK</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Institutional Digital Fixed-Income Infrastructure. Transparent, programmable, and auditor-verified ERC-4626 Sukuk protocol.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[0.6875rem] font-mono text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ETHEREUM SEPOLIA LIVE</span>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="space-y-3.5">
            <h2 className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest">
              Navigation
            </h2>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/sukuk" className="text-muted-foreground hover:text-ring transition-colors font-medium inline-flex items-center gap-1">
                  Sukuk Terminal
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-muted-foreground hover:text-ring transition-colors font-medium inline-flex items-center gap-1">
                  Portfolio Dashboard
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-muted-foreground hover:text-ring transition-colors font-medium inline-flex items-center gap-1">
                  On-Chain Ledger
                </Link>
              </li>
              <li>
                <Link href="/protocol" className="text-muted-foreground hover:text-ring transition-colors font-medium inline-flex items-center gap-1">
                  Protocol Specifications
                </Link>
              </li>
              <li>
                <Link href="/auditor" className="text-muted-foreground hover:text-ring transition-colors font-medium inline-flex items-center gap-1">
                  Auditor Oracle Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Smart Contracts Column */}
          <div className="space-y-3.5">
            <h2 className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest">
              Sepolia Smart Contracts
            </h2>
            <div className="space-y-2.5 text-xs font-mono">
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACTS.sukukVault}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between text-muted-foreground hover:text-ring transition-colors"
              >
                <span>Vault (ERC-4626):</span>
                <span className="font-bold text-foreground group-hover:text-ring flex items-center gap-1">
                  {compactAddress(CONTRACTS.sukukVault)}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
              <a
                href={`https://sepolia.etherscan.io/address/${CONTRACTS.idrx}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between text-muted-foreground hover:text-ring transition-colors"
              >
                <span>IDRX Token:</span>
                <span className="font-bold text-foreground group-hover:text-ring flex items-center gap-1">
                  {compactAddress(CONTRACTS.idrx)}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
              <a
                href={`https://app.safe.global/home?safe=sep:${ADDRESSES.auditorMultisig}`}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between text-muted-foreground hover:text-ring transition-colors"
              >
                <span>Safe Oracle (2-of-3):</span>
                <span className="font-bold text-foreground group-hover:text-ring flex items-center gap-1">
                  {compactAddress(ADDRESSES.auditorMultisig)}
                  <ExternalLink className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>

          {/* Governance Column */}
          <div className="space-y-3.5">
            <h2 className="text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-widest">
              Governance & Verification
            </h2>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-secondary/50 rounded-xl border border-border space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[0.6875rem]">
                  <span className="text-muted-foreground">Threshold</span>
                  <span className="font-bold text-ring">2-of-3 Multi-Sig</span>
                </div>
                <div className="flex items-center justify-between text-[0.6875rem]">
                  <span className="text-muted-foreground">Compliance</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> Verified
                  </span>
                </div>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground leading-normal">
                All vault state transitions require Safe multi-signature compliance approval.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <p>&copy; {new Date().getFullYear()} SUKUK Protocol &middot; All Rights Reserved</p>
          </div>

          <div className="flex items-center gap-4 font-mono text-[0.6875rem]">
            <span>CHAIN ID: 11155111</span>
            <span>&bull;</span>
            <a
              href="https://sepolia.etherscan.io/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              Sepolia Etherscan <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}