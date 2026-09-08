"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface EthereumProvider {
  request: (args: { method: string }) => Promise<string[]>;
}

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  balance: string;
  musicBalance: string;
  network: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  balance: "0.00",
  musicBalance: "0.00",
  network: "Polygon Amoy",
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const balance = "24.50";
  const musicBalance = "1,250.00";

  useEffect(() => {
    const saved = localStorage.getItem("mc_wallet");
    if (saved) {
      setAddress(saved);
      setIsConnected(true);
    }
  }, []);

  const connectWallet = async () => {
    try {
      if (typeof window !== "undefined") {
        const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
        if (eth) {
          const accounts = await eth.request({
            method: "eth_requestAccounts",
          });
          if (accounts && accounts[0]) {
            setAddress(accounts[0]);
            setIsConnected(true);
            localStorage.setItem("mc_wallet", accounts[0]);
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Injected wallet error, using fallback demo address", err);
    }

    // Fallback demo address for development/testing
    const demo = "0x71C...4e89";
    setAddress(demo);
    setIsConnected(true);
    localStorage.setItem("mc_wallet", demo);
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    localStorage.removeItem("mc_wallet");
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        balance,
        musicBalance,
        network: "Polygon Amoy",
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
