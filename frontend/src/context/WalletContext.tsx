"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const USE_LOCAL_BLOCKCHAIN =
  process.env.NEXT_PUBLIC_BLOCKCHAIN_NETWORK === "localhost";

const TARGET_CHAIN_ID = USE_LOCAL_BLOCKCHAIN
  ? "0x7a69"
  : "0x13882";

const TARGET_CHAIN_NAME = USE_LOCAL_BLOCKCHAIN
  ? "Hardhat Local"
  : "Polygon Amoy";

const TARGET_CURRENCY = USE_LOCAL_BLOCKCHAIN
  ? {
      name: "Local ETH",
      symbol: "ETH",
      decimals: 18,
    }
  : {
      name: "POL",
      symbol: "POL",
      decimals: 18,
    };

const TARGET_RPC_URLS = USE_LOCAL_BLOCKCHAIN
  ? ["http://127.0.0.1:8545"]
  : [
      "https://polygon-amoy.drpc.org",
      "https://80002.rpc.thirdweb.com",
    ];

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

  return fraction ? `${whole}.${fraction}` : whole.toString();
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
    return Number((error as { code?: number }).code);
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

async function ensureTargetNetwork(
  provider: EthereumProvider
) {
  const currentChain = (await provider.request({
    method: "eth_chainId",
  })) as string;

  if (
    currentChain.toLowerCase() ===
    TARGET_CHAIN_ID.toLowerCase()
  ) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: TARGET_CHAIN_ID,
        },
      ],
    });
  } catch (switchError) {
    if (getErrorCode(switchError) !== 4902) {
      throw switchError;
    }

    const networkConfiguration = {
      chainId: TARGET_CHAIN_ID,
      chainName: TARGET_CHAIN_NAME,
      nativeCurrency: TARGET_CURRENCY,
      rpcUrls: TARGET_RPC_URLS,
      ...(USE_LOCAL_BLOCKCHAIN
        ? {}
        : {
            blockExplorerUrls: [
              "https://amoy.polygonscan.com",
            ],
          }),
    };

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [networkConfiguration],
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
      const rawBalance = (await provider.request({
        method: "eth_getBalance",
        params: [walletAddress, "latest"],
      })) as string;

      setBalance(
        formatUnits(BigInt(rawBalance), 18)
      );

      const tokenAddress =
        process.env.NEXT_PUBLIC_MUSIC_TOKEN_ADDRESS;

      if (!tokenAddress) {
        setMusicBalance("Not configured");
        return;
      }

      const contractCode = (await provider.request({
        method: "eth_getCode",
        params: [tokenAddress, "latest"],
      })) as string;

      if (
        !contractCode ||
        contractCode === "0x" ||
        contractCode === "0x0"
      ) {
        setMusicBalance("Not deployed");
        return;
      }

      const rawDecimals = (await provider.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: "0x313ce567",
          },
          "latest",
        ],
      })) as string;

      const rawTokenBalance = (await provider.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: encodeBalanceOf(walletAddress),
          },
          "latest",
        ],
      })) as string;

      setMusicBalance(
        formatUnits(
          BigInt(rawTokenBalance),
          Number(BigInt(rawDecimals)),
          2
        )
      );
    },
    []
  );

  const syncCurrentNetwork = useCallback(
    async (
      provider: EthereumProvider,
      walletAddress: string
    ) => {
      try {
        const chainId = (await provider.request({
          method: "eth_chainId",
        })) as string;

        if (
          chainId.toLowerCase() ===
          TARGET_CHAIN_ID.toLowerCase()
        ) {
          setNetwork(TARGET_CHAIN_NAME);

          await loadBalances(
            provider,
            walletAddress
          );

          setError("");
          return;
        }

        setNetwork(
          `Connected on chain ${parseInt(chainId, 16)}`
        );

        setBalance("0.00");
        setMusicBalance("Wrong network");
      } catch (networkError) {
        console.error(
          "Unable to read wallet network",
          networkError
        );

        setNetwork(
          "Wallet connected — network unavailable"
        );

        setBalance("0.00");
        setMusicBalance("Unavailable");
      }
    },
    [loadBalances]
  );

  const saveConnectedAccount = useCallback(
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

  const connectWallet = useCallback(async () => {
    setError("");

    if (!window.ethereum) {
      setError(
        "Install MetaMask to connect a blockchain wallet."
      );
      return;
    }

    setIsConnecting(true);

    try {
      const accounts =
        (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];

      const walletAddress = accounts[0];

      if (!walletAddress) {
        throw new Error(
          "No wallet account was selected."
        );
      }

      setAddress(walletAddress);

      localStorage.setItem(
        "mc_wallet",
        walletAddress
      );

      try {
        await ensureTargetNetwork(
          window.ethereum
        );

        await syncCurrentNetwork(
          window.ethereum,
          walletAddress
        );
      } catch (networkError) {
        console.error(
          `${TARGET_CHAIN_NAME} connection failed`,
          networkError
        );

        setNetwork(
          `Wallet connected — ${TARGET_CHAIN_NAME} unavailable`
        );

        setBalance("0.00");
        setMusicBalance("Unavailable");

        setError(
          `Wallet connected successfully, but ${TARGET_CHAIN_NAME} could not be opened: ${getErrorMessage(
            networkError
          )}`
        );
      }
    } catch (walletError) {
      console.error(
        "Wallet connection failed",
        walletError
      );

      setError(getErrorMessage(walletError));
    } finally {
      setIsConnecting(false);
    }
  }, [syncCurrentNetwork]);

  const disconnectWallet = useCallback(() => {
    clearWallet();
  }, [clearWallet]);

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const provider = window.ethereum;

    async function restoreConnection() {
      try {
        const accounts = (await provider.request({
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
      const accounts = args[0] as string[];

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
        localStorage.getItem("mc_wallet");

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
      isConnected: Boolean(address),
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
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider."
    );
  }

  return context;
}