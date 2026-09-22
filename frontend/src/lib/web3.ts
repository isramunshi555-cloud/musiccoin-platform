import { BrowserProvider } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export async function connectWallet() {
  if (typeof window === "undefined") {
    throw new Error("Browser environment required");
  }

  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
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