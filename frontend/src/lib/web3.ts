import { BrowserProvider } from "ethers";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

const POLYGON_AMOY_CHAIN_ID = "0x13882";

export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required");
  }

  const ethereum = (
    window as Window & {
      ethereum?: EthereumProvider;
    }
  ).ethereum;

  if (!ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
    });
  } catch (error: unknown) {
    const switchError = error as {
      code?: number;
    };

    if (switchError.code === 4902) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: POLYGON_AMOY_CHAIN_ID,
            chainName: "Polygon Amoy",
            nativeCurrency: {
              name: "POL",
              symbol: "POL",
              decimals: 18,
            },
            rpcUrls: ["https://polygon-amoy.drpc.org"],
            blockExplorerUrls: ["https://amoy.polygonscan.com"],
          },
        ],
      });
    } else {
      throw error;
    }
  }

  const provider = new BrowserProvider(ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
  };
}

