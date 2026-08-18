"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect } from "wagmi";
import { compactAddress } from "@/lib/formatters";
import { ADDRESSES } from "@/contracts/addresses";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Copy, ExternalLink, Shield, Menu, X } from "lucide-react";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { ScrollProgressBar } from "@/components/ui/motion";
import { motion, AnimatePresence } from "framer-motion";

const PUBLIC_NAV = [
  { href: "/sukuk", label: "Sukuk" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/transactions", label: "Transactions" },
  { href: "/protocol", label: "Protocol" },
];

export function Header() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isAdmin = isConnected && address?.toLowerCase() === ADDRESSES.protocolAdmin.toLowerCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <>
      <ScrollProgressBar />
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/80 transition-all duration-300">
        <div className="container h-16 flex items-center justify-between">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-10">
            <Link
              href="/"
              className="wordmark group text-foreground transition-transform duration-300 hover:scale-105"
            >
              <div className="brand-mark group-hover:rotate-45 transition-transform duration-500">
                <span />
                <span />
                <span />
                <span />
              </div>
              <span>SUKUK</span>
            </Link>

            {/* Desktop Navigation Links with Framer Motion Active Indicator */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-semibold" aria-label="Main Navigation">
              {PUBLIC_NAV.map((n) => {
                const isActive = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`relative py-1 transition-colors duration-200 ${
                      isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n.label}
                    {isActive && (
                      <motion.span
                        layoutId="activeNavIndicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-ring rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                    pathname === "/admin"
                      ? "bg-foreground text-background shadow-xs"
                      : "text-emerald-800 bg-emerald-100/80 border border-emerald-300 hover:bg-emerald-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Right Network & Account trigger */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:inline-flex items-center gap-2 text-[0.6875rem] font-mono font-semibold px-2.5 py-1 rounded-full bg-secondary border border-border">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sepolia</span>
            </div>

            {isConnected ? (
              <div className="relative" ref={ref}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                  aria-label="User Account Menu"
                  className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground bg-secondary border border-border px-3.5 py-1.5 rounded-full hover:bg-border/60 transition-all shadow-2xs"
                >
                  <span>{address ? compactAddress(address) : ""}</span>
                  {isAdmin && (
                    <span className="text-[0.625rem] px-1.5 py-0.5 bg-emerald-200 text-emerald-900 rounded font-semibold">
                      ADMIN
                    </span>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-xl shadow-xl py-2 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-border/80">
                        <div className="flex items-center justify-between">
                          <p className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-semibold">Connected Account</p>
                          {isAdmin && (
                            <span className="text-[0.625rem] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-semibold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs mt-1 font-semibold text-foreground">
                          {address ? compactAddress(address) : ""}
                        </p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-800 font-semibold hover:bg-emerald-50 transition-colors"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Admin Control Panel
                        </Link>
                      )}

                      <button
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors font-semibold"
                        onClick={() => {
                          navigator.clipboard.writeText(address ?? "");
                          setMenuOpen(false);
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        Copy Address
                      </button>

                      <a
                        href={`https://sepolia.etherscan.io/address/${address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-secondary transition-colors font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        View on Explorer
                      </a>

                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors"
                          onClick={() => {
                            disconnect();
                            setMenuOpen(false);
                          }}
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <WalletConnect />
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              aria-expanded={mobileNavOpen}
              aria-label="Toggle Mobile Navigation"
              className="md:hidden p-2 rounded-full border border-border text-foreground hover:bg-secondary transition-colors"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:hidden overflow-hidden border-t border-border bg-background px-6 py-4 space-y-3"
              aria-label="Mobile Navigation"
            >
              <div className="flex flex-col space-y-1">
                {PUBLIC_NAV.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname === n.href
                        ? "bg-secondary text-foreground font-bold"
                        : "text-muted-foreground hover:text-foreground font-medium"
                    }`}
                  >
                    {n.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors ${
                      pathname === "/admin"
                        ? "bg-foreground text-background"
                        : "text-emerald-800 bg-emerald-50 border border-emerald-200"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}