"use client";

import { useState } from "react";
import {
  Contract,
  formatEther,
  parseEther,
} from "ethers";

import api from "@/lib/api";
import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const FAN_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function stake(uint256 amount, uint256 lockDuration)",
];

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (
      error as {
        message?: unknown;
      }
    ).message === "string"
  ) {
    return (
      error as {
        message: string;
      }
    ).message;
  }

  return "Something went wrong.";
}

export default function WalletConnect() {
  const [address, setAddress] =
    useState("");

  const [balance, setBalance] =
    useState("");

  const [tokenName, setTokenName] =
    useState("");

  const [tokenSymbol, setTokenSymbol] =
    useState("");

  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [stakeAmount, setStakeAmount] =
    useState("");

  const [lockDuration, setLockDuration] =
    useState("2592000");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [sending, setSending] =
    useState(false);

  async function getTokenBalance() {
    const {
      signer,
      address: walletAddress,
      chainId,
    } = await connectWallet();

    if (chainId !== 80002) {
      throw new Error(
        "Please switch MetaMask to Polygon Amoy.",
      );
    }

    const token = new Contract(
      CONTRACT_ADDRESSES.fanToken,
      FAN_TOKEN_ABI,
      signer,
    );

    const tokenBalance =
      await token.balanceOf(
        walletAddress,
      );

    const name =
      await token.name();

    const symbol =
      await token.symbol();

    setAddress(walletAddress);

    setBalance(
      formatEther(tokenBalance),
    );

    setTokenName(name);
    setTokenSymbol(symbol);
  }

  async function recordTransaction(
    data: {
      tx_hash: string;
      tx_type:
        | "MUSIC_TRANSFER"
        | "STAKE";
      amount: string;
      currency: string;
      status: "CONFIRMED";
      from_address: string;
      to_address: string;
    },
  ) {
    await api.post(
      "/wallet/transactions/",
      data,
    );
  }

  async function handleConnect() {
    try {
      setError("");
      setSuccess("");

      await getTokenBalance();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error),
      );
    }
  }

  async function refreshBalance() {
    try {
      setError("");
      setSuccess("");

      await getTokenBalance();
    } catch (error: unknown) {
      setError(
        getErrorMessage(error),
      );
    }
  }

  async function sendMusic() {
    try {
      setSending(true);

      setError("");
      setSuccess("");

      if (!recipient.trim()) {
        throw new Error(
          "Enter recipient wallet address.",
        );
      }

      if (!amount) {
        throw new Error(
          "Enter MUSIC amount.",
        );
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount,
        ) ||
        numericAmount <= 0
      ) {
        throw new Error(
          "Amount must be greater than 0.",
        );
      }

      const {
        signer,
        address: senderAddress,
        chainId,
      } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error(
          "Please switch MetaMask to Polygon Amoy.",
        );
      }

      const token = new Contract(
        CONTRACT_ADDRESSES.fanToken,
        FAN_TOKEN_ABI,
        signer,
      );

      const tx =
        await token.transfer(
          recipient.trim(),
          parseEther(amount),
          AMOY_GAS,
        );

      await tx.wait();

      let auditRecorded = true;

      try {
        await recordTransaction({
          tx_hash: tx.hash,

          tx_type:
            "MUSIC_TRANSFER",

          amount,

          currency: "MUSIC",

          status: "CONFIRMED",

          from_address:
            senderAddress,

          to_address:
            recipient.trim(),
        });
      } catch (
        auditError: unknown
      ) {
        auditRecorded = false;

        console.error(
          "Transfer confirmed but transaction logging failed:",
          auditError,
        );
      }

      if (auditRecorded) {
        setSuccess(
          `${amount} MUSIC sent successfully and recorded for admin monitoring`,
        );
      } else {
        setSuccess(
          `${amount} MUSIC sent successfully`,
        );

        setError(
          "The blockchain transfer succeeded, but the admin record could not be saved.",
        );
      }

      await getTokenBalance();

      setRecipient("");
      setAmount("");
    } catch (error: unknown) {
      setError(
        getErrorMessage(error),
      );
    } finally {
      setSending(false);
    }
  }

  async function stakeMusic() {
    try {
      setSending(true);

      setError("");
      setSuccess("");

      if (!stakeAmount) {
        throw new Error(
          "Enter an amount to stake.",
        );
      }

      const numericAmount =
        Number(stakeAmount);

      if (
        !Number.isFinite(
          numericAmount,
        ) ||
        numericAmount <= 0
      ) {
        throw new Error(
          "Stake amount must be greater than 0.",
        );
      }

      const {
        signer,
        address: senderAddress,
        chainId,
      } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error(
          "Please switch MetaMask to Polygon Amoy.",
        );
      }

      const token = new Contract(
        CONTRACT_ADDRESSES.fanToken,
        FAN_TOKEN_ABI,
        signer,
      );

      const tx =
        await token.stake(
          parseEther(
            stakeAmount,
          ),

          BigInt(
            lockDuration,
          ),

          AMOY_GAS,
        );

      await tx.wait();

      let auditRecorded = true;

      try {
        await recordTransaction({
          tx_hash: tx.hash,

          tx_type: "STAKE",

          amount:
            stakeAmount,

          currency: "MUSIC",

          status:
            "CONFIRMED",

          from_address:
            senderAddress,

          to_address:
            CONTRACT_ADDRESSES
              .fanToken,
        });
      } catch (
        auditError: unknown
      ) {
        auditRecorded = false;

        console.error(
          "Stake confirmed but transaction logging failed:",
          auditError,
        );
      }

      if (auditRecorded) {
        setSuccess(
          `${stakeAmount} MUSIC staked successfully and recorded`,
        );
      } else {
        setSuccess(
          `${stakeAmount} MUSIC staked successfully`,
        );

        setError(
          "The blockchain stake succeeded, but the admin record could not be saved.",
        );
      }

      await getTokenBalance();

      setStakeAmount("");
    } catch (error: unknown) {
      setError(
        getErrorMessage(error),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {!address ? (
        <button
          type="button"
          onClick={
            handleConnect
          }
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <p>
              Wallet:{" "}
              {address.slice(
                0,
                6,
              )}
              ...
              {address.slice(
                -4,
              )}
            </p>

            <p>
              Token:{" "}
              {tokenName} (
              {tokenSymbol})
            </p>

            <p>
              MUSIC Balance:{" "}
              {balance}
            </p>
          </div>

          <button
            type="button"
            onClick={
              refreshBalance
            }
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
              value={
                recipient
              }
              onChange={(
                event,
              ) =>
                setRecipient(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <input
              type="number"
              min="0"
              step="any"
              placeholder="Amount of MUSIC"
              value={amount}
              onChange={(
                event,
              ) =>
                setAmount(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <button
              type="button"
              onClick={
                sendMusic
              }
              disabled={
                sending
              }
              className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "Sending..."
                : "Send MUSIC"}
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
              value={
                stakeAmount
              }
              onChange={(
                event,
              ) =>
                setStakeAmount(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            />

            <select
              value={
                lockDuration
              }
              onChange={(
                event,
              ) =>
                setLockDuration(
                  event.target
                    .value,
                )
              }
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
            >
              <option value="2592000">
                30 Days — 5%
                APY
              </option>

              <option value="7776000">
                90 Days — 10%
                APY
              </option>

              <option value="15552000">
                180 Days — 15%
                APY
              </option>

              <option value="31536000">
                365 Days — 25%
                APY
              </option>
            </select>

            <button
              type="button"
              onClick={
                stakeMusic
              }
              disabled={
                sending
              }
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending
                ? "Processing..."
                : "Stake MUSIC"}
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