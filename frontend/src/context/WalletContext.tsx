"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AMOY_CHAIN_ID = "0x13882";
const AMOY_CHAIN_NAME = "Polygon Amoy";

type RequestArguments = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

interface EthereumProvider {
  request: (args: RequestArguments) => Promise<unknown>;
  on?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void
  ) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string;
  musicBalance: string;
  network: string;
  error: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

function formatUnits(
  value: bigint,
  decimals: number,
  precision = 4
) {
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = value / divisor;

  const fraction = (value % divisor)
    .toString()
    .padStart(decimals, "0")
    .slice(0, precision)
    .replace(/0+$/, "");

  return fraction
    ? `${whole}.${fraction}`
    : whole.toString();
}

function encodeBalanceOf(address: string) {
  return `0x70a08231${address
    .slice(2)
    .toLowerCase()
    .padStart(64, "0")}`;
}

function getErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    return Number(
      (error as { code?: number }).code
    );
  }

  return undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message
    );
  }

  return "Unknown wallet error.";
}

async function ensureAmoyNetwork(
  provider: EthereumProvider
) {
  const currentChain = (await provider.request({
    method: "eth_chainId",
  })) as string;

  if (
    currentChain.toLowerCase() ===
    AMOY_CHAIN_ID.toLowerCase()
  ) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: AMOY_CHAIN_ID,
        },
      ],
    });
  } catch (switchError) {
    if (getErrorCode(switchError) !== 4902) {
      throw switchError;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: AMOY_CHAIN_ID,
          chainName: AMOY_CHAIN_NAME,
          nativeCurrency: {
            name: "POL",
            symbol: "POL",
            decimals: 18,
          },
          rpcUrls: [
            "https://polygon-amoy.drpc.org",
            "https://80002.rpc.thirdweb.com",
          ],
          blockExplorerUrls: [
            "https://amoy.polygonscan.com",
          ],
        },
      ],
    });
  }
}

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [address, setAddress] =
    useState<string | null>(null);

  const [balance, setBalance] =
    useState("0.00");

  const [musicBalance, setMusicBalance] =
    useState("Not configured");

  const [network, setNetwork] =
    useState("Disconnected");

  const [isConnecting, setIsConnecting] =
    useState(false);

  const [error, setError] = useState("");

  const clearWallet = useCallback(() => {
    setAddress(null);
    setBalance("0.00");
    setMusicBalance("Not configured");
    setNetwork("Disconnected");
    setError("");

    localStorage.removeItem("mc_wallet");
  }, []);

  const loadBalances = useCallback(
    async (
      provider: EthereumProvider,
      walletAddress: string
    ) => {
      const rawBalance =
        (await provider.request({
          method: "eth_getBalance",
          params: [
            walletAddress,
            "latest",
          ],
        })) as string;

      setBalance(
        formatUnits(
          BigInt(rawBalance),
          18
        )
      );

      const tokenAddress =
        process.env
          .NEXT_PUBLIC_MUSIC_TOKEN_ADDRESS;

      if (!tokenAddress) {
        setMusicBalance(
          "Not configured"
        );
        return;
      }

      const rawDecimals =
        (await provider.request({
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: "0x313ce567",
            },
            "latest",
          ],
        })) as string;

      const rawTokenBalance =
        (await provider.request({
          method: "eth_call",
          params: [
            {
              to: tokenAddress,
              data: encodeBalanceOf(
                walletAddress
              ),
            },
            "latest",
          ],
        })) as string;

      setMusicBalance(
        formatUnits(
          BigInt(rawTokenBalance),
          Number(
            BigInt(rawDecimals)
          ),
          2
        )
      );
    },
    []
  );

  const syncCurrentNetwork =
    useCallback(
      async (
        provider: EthereumProvider,
        walletAddress: string
      ) => {
        try {
          const chainId =
            (await provider.request({
              method: "eth_chainId",
            })) as string;

          if (
            chainId.toLowerCase() ===
            AMOY_CHAIN_ID.toLowerCase()
          ) {
            setNetwork(
              AMOY_CHAIN_NAME
            );

            await loadBalances(
              provider,
              walletAddress
            );

            setError("");
            return;
          }

          setNetwork(
            `Connected on chain ${parseInt(
              chainId,
              16
            )}`
          );

          setBalance("0.00");
          setMusicBalance(
            "Not configured"
          );
        } catch (networkError) {
          console.error(
            "Unable to read wallet network",
            networkError
          );

          setNetwork(
            "Wallet connected — network unavailable"
          );

          setBalance("0.00");
          setMusicBalance(
            "Not configured"
          );
        }
      },
      [loadBalances]
    );

  const saveConnectedAccount =
    useCallback(
      async (
        provider: EthereumProvider,
        walletAddress: string
      ) => {
        setAddress(walletAddress);

        localStorage.setItem(
          "mc_wallet",
          walletAddress
        );

        await syncCurrentNetwork(
          provider,
          walletAddress
        );
      },
      [syncCurrentNetwork]
    );

  const connectWallet =
    useCallback(async () => {
      setError("");

      if (!window.ethereum) {
        setError(
          "Install MetaMask to connect a Polygon wallet."
        );
        return;
      }

      setIsConnecting(true);

      try {
        const accounts =
          (await window.ethereum.request({
            method:
              "eth_requestAccounts",
          })) as string[];

        const walletAddress =
          accounts[0];

        if (!walletAddress) {
          throw new Error(
            "No wallet account was selected."
          );
        }

        // Save the account before attempting
        // the network switch.
        setAddress(walletAddress);

        localStorage.setItem(
          "mc_wallet",
          walletAddress
        );

        try {
          await ensureAmoyNetwork(
            window.ethereum
          );

          await syncCurrentNetwork(
            window.ethereum,
            walletAddress
          );
        } catch (networkError) {
          console.error(
            "Polygon Amoy connection failed",
            networkError
          );

          setNetwork(
            "Wallet connected — Amoy unavailable"
          );

          setBalance("0.00");
          setMusicBalance(
            "Not configured"
          );

          setError(
            `Wallet connected successfully, but Polygon Amoy could not be opened: ${getErrorMessage(
              networkError
            )}`
          );
        }
      } catch (walletError) {
        console.error(
          "Wallet connection failed",
          walletError
        );

        setError(
          getErrorMessage(
            walletError
          )
        );
      } finally {
        setIsConnecting(false);
      }
    }, [syncCurrentNetwork]);

  const disconnectWallet =
    useCallback(() => {
      clearWallet();
    }, [clearWallet]);

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const provider =
      window.ethereum;

    async function restoreConnection() {
      try {
        const accounts =
          (await provider.request({
            method: "eth_accounts",
          })) as string[];

        if (accounts[0]) {
          await saveConnectedAccount(
            provider,
            accounts[0]
          );
        } else {
          clearWallet();
        }
      } catch (restoreError) {
        console.error(
          "Wallet restoration failed",
          restoreError
        );

        clearWallet();
      }
    }

    const handleAccountsChanged = (
      ...args: unknown[]
    ) => {
      const accounts =
        args[0] as string[];

      if (!accounts?.[0]) {
        clearWallet();
        return;
      }

      void saveConnectedAccount(
        provider,
        accounts[0]
      );
    };

    const handleChainChanged = () => {
      const savedAddress =
        localStorage.getItem(
          "mc_wallet"
        );

      if (savedAddress) {
        void syncCurrentNetwork(
          provider,
          savedAddress
        );
      }
    };

    void restoreConnection();

    provider.on?.(
      "accountsChanged",
      handleAccountsChanged
    );

    provider.on?.(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      provider.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );

      provider.removeListener?.(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [
    clearWallet,
    saveConnectedAccount,
    syncCurrentNetwork,
  ]);

  const value = useMemo(
    () => ({
      address,
      isConnected:
        Boolean(address),
      isConnecting,
      balance,
      musicBalance,
      network,
      error,
      connectWallet,
      disconnectWallet,
    }),
    [
      address,
      balance,
      connectWallet,
      disconnectWallet,
      error,
      isConnecting,
      musicBalance,
      network,
    ]
  );

  return (
    <WalletContext.Provider
      value={value}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context =
    useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider."
    );
  }

  return context;
}