"use client";

import { useState } from "react";
import { Contract, formatEther, parseEther } from "ethers";

import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const FAN_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function stake(uint256 amount, uint256 lockDuration)",
];

export default function WalletConnect() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const [stakeAmount, setStakeAmount] = useState("");
  const [lockDuration, setLockDuration] = useState("2592000");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  const getTokenBalance = async () => {
    const { signer, address, chainId } = await connectWallet();

    if (chainId !== 31337) {
      throw new Error("Please switch MetaMask to Hardhat Local network.");
    }

    const token = new Contract(
      CONTRACT_ADDRESSES.fanToken,
      FAN_TOKEN_ABI,
      signer
    );

    const tokenBalance = await token.balanceOf(address);
    const name = await token.name();
    const symbol = await token.symbol();

    setAddress(address);
    setBalance(formatEther(tokenBalance));
    setTokenName(name);
    setTokenSymbol(symbol);
  };

  const handleConnect = async () => {
    try {
      setError("");
      setSuccess("");

      await getTokenBalance();
    } catch (err: any) {
      setError(err?.message || "Wallet connection failed");
    }
  };

  const refreshBalance = async () => {
    try {
      setError("");
      setSuccess("");

      await getTokenBalance();
    } catch (err: any) {
      setError(err?.message || "Could not refresh balance");
    }
  };

  const sendMusic = async () => {
    try {
      setSending(true);
      setError("");
      setSuccess("");

      if (!recipient || !amount) {
        throw new Error("Enter recipient address and amount.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 31337) {
        throw new Error("Please switch MetaMask to Hardhat Local network.");
      }

      const token = new Contract(
        CONTRACT_ADDRESSES.fanToken,
        FAN_TOKEN_ABI,
        signer
      );

      const tx = await token.transfer(
        recipient,
        parseEther(amount)
      );

      await tx.wait();

      setSuccess(`${amount} MUSIC sent successfully`);

      await getTokenBalance();

      setRecipient("");
      setAmount("");
    } catch (err: any) {
      setError(err?.message || "Token transfer failed");
    } finally {
      setSending(false);
    }
  };

  const stakeMusic = async () => {
    try {
      setSending(true);
      setError("");
      setSuccess("");

      if (!stakeAmount) {
        throw new Error("Enter an amount to stake.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 31337) {
        throw new Error("Please switch MetaMask to Hardhat Local network.");
      }

      const token = new Contract(
        CONTRACT_ADDRESSES.fanToken,
        FAN_TOKEN_ABI,
        signer
      );

      const tx = await token.stake(
        parseEther(stakeAmount),
        BigInt(lockDuration)
      );

      await tx.wait();

      setSuccess(`${stakeAmount} MUSIC staked successfully`);

      await getTokenBalance();

      setStakeAmount("");
    } catch (err: any) {
      setError(err?.message || "Staking failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {!address ? (
        <button
          onClick={handleConnect}
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <p>
              Wallet: {address.slice(0, 6)}...{address.slice(-4)}
            </p>

            <p>
              Token: {tokenName} ({tokenSymbol})
            </p>

            <p>
              MUSIC Balance: {balance}
            </p>
          </div>

          <button
            onClick={refreshBalance}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800"
          >
            Refresh Balance
          </button>

          <div className="space-y-3 border-t border-neutral-800 pt-4">
            <p className="font-semibold">
              Send MUSIC
            </p>

            <input
              type="text"
              placeholder="Recipient wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount of MUSIC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <button
              onClick={sendMusic}
              disabled={sending}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send MUSIC"}
            </button>
          </div>

          <div className="space-y-3 border-t border-neutral-800 pt-4">
            <p className="font-semibold">
              Stake MUSIC
            </p>

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount to stake"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <select
              value={lockDuration}
              onChange={(e) => setLockDuration(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            >
              <option value="2592000">
                30 Days — 5% APY
              </option>

              <option value="7776000">
                90 Days — 10% APY
              </option>

              <option value="15552000">
                180 Days — 15% APY
              </option>

              <option value="31536000">
                365 Days — 25% APY
              </option>
            </select>

            <button
              onClick={stakeMusic}
              disabled={sending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Processing..." : "Stake MUSIC"}
            </button>
          </div>
        </div>
      )}

      {success && (
        <p className="text-sm text-green-400">
          {success}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}