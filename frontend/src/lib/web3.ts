import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const POLYGON_AMOY_CHAIN_ID = "0x13882"; // 80002

export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required");
  }

  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Ask MetaMask to switch to Polygon Amoy
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY_CHAIN_ID }],
    });
  } catch (switchError: any) {
    // Chain not added in MetaMask yet
    if (switchError?.code === 4902) {
      await window.ethereum.request({
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
      throw switchError;
    }
  }

  const provider = new BrowserProvider(window.ethereum);

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
