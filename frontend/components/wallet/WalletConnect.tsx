"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnect } from "wagmi";

export function WalletConnect() {
  const { connectors, connect } = useConnect();

  const handleDirectInjectedConnect = async (openConnectModal: () => void) => {
    // 1. Try injected connector first
    const injectedConn = connectors.find((c) => c.id === "injected" || c.type === "injected");
    if (injectedConn) {
      try {
        if (typeof window !== "undefined" && (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<unknown> } }).ethereum) {
          const eth = (window as unknown as { ethereum: { request: (args: { method: string }) => Promise<unknown> } }).ethereum;
          await eth.request({ method: "eth_requestAccounts" });
        }
        connect({ connector: injectedConn });
        return;
      } catch (err) {
        console.warn("Direct injected connect notice:", err);
      }
    }
    // 2. Fallback to RainbowKit Modal
    openConnectModal();
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={() => handleDirectInjectedConnect(openConnectModal)}
                    type="button"
                    className="px-3.5 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded-md hover:bg-emerald-900 transition-colors shadow-sm"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-3.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="px-3.5 py-1.5 bg-surface border text-foreground text-xs font-mono font-medium rounded-md hover:bg-divider transition-colors shadow-sm"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}