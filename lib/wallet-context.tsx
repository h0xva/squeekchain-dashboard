"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { isAddress } from "./account-api";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type WalletContextValue = {
  account: string | null;
  chainId: string | null;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  clearError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const REMEMBER = "squeek-dashboard:wallet";

const provider = () =>
  typeof window === "undefined" ? undefined : (window as unknown as { ethereum?: EthereumProvider }).ethereum;

/** Read-only wallet link (EIP-1193). It never requests a signature or a transaction. */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const readChain = useCallback(async (ethereum: EthereumProvider) => {
    try {
      const chain = await ethereum.request({ method: "eth_chainId" });
      if (typeof chain === "string") setChainId(chain);
    } catch {
      /* Portfolio reads use the public API and do not depend on the wallet chain. */
    }
  }, []);

  useEffect(() => {
    // Restore a wallet the visitor already linked here, without prompting.
    const ethereum = provider();
    if (!ethereum || localStorage.getItem(REMEMBER) !== "1") return;
    void ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (Array.isArray(accounts) && typeof accounts[0] === "string" && isAddress(accounts[0])) {
          setAccount(accounts[0].toLowerCase());
          void readChain(ethereum);
        }
      })
      .catch(() => undefined);
  }, [readChain]);

  useEffect(() => {
    const ethereum = provider();
    if (!ethereum || !account) return;
    const onAccounts = (...args: unknown[]) => {
      const list = args[0];
      const next = Array.isArray(list) && typeof list[0] === "string" && isAddress(list[0]) ? list[0].toLowerCase() : null;
      setAccount(next);
      if (!next) localStorage.removeItem(REMEMBER);
    };
    const onChain = (...args: unknown[]) => {
      if (typeof args[0] === "string") setChainId(args[0]);
    };
    ethereum.on?.("accountsChanged", onAccounts);
    ethereum.on?.("chainChanged", onChain);
    return () => {
      ethereum.removeListener?.("accountsChanged", onAccounts);
      ethereum.removeListener?.("chainChanged", onChain);
    };
  }, [account]);

  const connect = useCallback(async () => {
    if (inFlight.current) return null;
    setError(null);
    const ethereum = provider();
    if (!ethereum) {
      setError("No browser wallet found. Install an Ethereum wallet, or paste any address to explore it.");
      return null;
    }
    inFlight.current = true;
    setConnecting(true);
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (!Array.isArray(accounts) || typeof accounts[0] !== "string" || !isAddress(accounts[0])) {
        throw new Error("Your wallet did not return an address.");
      }
      const selected = accounts[0].toLowerCase();
      setAccount(selected);
      localStorage.setItem(REMEMBER, "1");
      void readChain(ethereum);
      return selected;
    } catch (err) {
      const code = (err as { code?: number })?.code;
      setError(
        code === 4001
          ? "Connection declined. You can try again whenever you like."
          : code === -32002
            ? "A wallet request is already open. Check your wallet extension."
            : err instanceof Error
              ? err.message
              : "Unable to connect your wallet.",
      );
      return null;
    } finally {
      inFlight.current = false;
      setConnecting(false);
    }
  }, [readChain]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setError(null);
    localStorage.removeItem(REMEMBER);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ account, chainId, connecting, error, connect, disconnect, clearError }),
    [account, chainId, connecting, error, connect, disconnect, clearError],
  );
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside <WalletProvider>");
  return value;
}
