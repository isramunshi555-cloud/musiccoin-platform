"use client";

import { useState } from "react";
import { Contract, id, parseEther, formatEther } from "ethers";

import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const ROYALTY_ABI = [
  "function createSplit(bytes32 splitId, address[] payees, uint256[] shares)",
  "function distribute(bytes32 splitId) payable",
  "function getSplitDetails(bytes32 splitId) view returns (address[] payees, uint256[] shares, uint256 totalShares, uint256 totalReceived, bool exists)",
  "function pendingPayment(bytes32 splitId, address payee) view returns (uint256)",
  "function release(bytes32 splitId, address payee)",
  "function releaseAll(bytes32 splitId)",
];

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

export default function RoyaltyDistributionPanel() {
  const [message, setMessage] = useState("");

  // CREATE SPLIT
  const [splitName, setSplitName] = useState("");
  const [payeesInput, setPayeesInput] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [creating, setCreating] = useState(false);

  // DISTRIBUTE
  const [distributionName, setDistributionName] = useState("");
  const [distributionAmount, setDistributionAmount] = useState("");
  const [distributing, setDistributing] = useState(false);

  // CHECK SPLIT
  const [checkName, setCheckName] = useState("");
  const [checking, setChecking] = useState(false);

  // RELEASE ONE
  const [releaseName, setReleaseName] = useState("");
  const [releasePayee, setReleasePayee] = useState("");
  const [releasing, setReleasing] = useState(false);

  // RELEASE ALL
  const [releaseAllName, setReleaseAllName] = useState("");
  const [releasingAll, setReleasingAll] = useState(false);

  const getContract = async () => {
    const { signer, chainId } = await connectWallet();

    if (chainId !== 80002) {
      throw new Error("Please switch MetaMask to Polygon Amoy.");
    }

    return new Contract(
      CONTRACT_ADDRESSES.royaltyDistribution,
      ROYALTY_ABI,
      signer
    );
  };

  const handleCreateSplit = async () => {
    try {
      setCreating(true);
      setMessage("");

      if (!splitName || !payeesInput || !sharesInput) {
        throw new Error("Fill all create-split fields.");
      }

      const payees = payeesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const shares = sharesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => BigInt(item));

      if (payees.length !== shares.length) {
        throw new Error(
          "The number of payees and shares must be the same."
        );
      }

      if (payees.length === 0) {
        throw new Error("Add at least one payee.");
      }

      const contract = await getContract();

      const splitId = id(splitName);

      const tx = await contract.createSplit(
        splitId,
        payees,
        shares,
        AMOY_GAS
      );

      await tx.wait();

      setMessage(
        `Royalty split "${splitName}" created successfully`
      );

      setSplitName("");
      setPayeesInput("");
      setSharesInput("");
    } catch (err: any) {
      setMessage(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Royalty split creation failed."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDistribute = async () => {
    try {
      setDistributing(true);
      setMessage("");

      if (!distributionName || !distributionAmount) {
        throw new Error(
          "Enter the split name and POL amount to distribute."
        );
      }

      const numericAmount = Number(distributionAmount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error("Distribution amount must be greater than 0.");
      }

      const contract = await getContract();

      const splitId = id(distributionName);

      const details = await contract.getSplitDetails(splitId);

      if (!details[4]) {
        throw new Error(
          `Royalty split "${distributionName}" does not exist.`
        );
      }

      const tx = await contract.distribute(splitId, {
        value: parseEther(distributionAmount),
        ...AMOY_GAS,
      });

      await tx.wait();

      setMessage(
        `${distributionAmount} POL distributed successfully to "${distributionName}"`
      );

      setDistributionName("");
      setDistributionAmount("");
    } catch (err: any) {
      setMessage(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Royalty distribution failed."
      );
    } finally {
      setDistributing(false);
    }
  };

  const handleCheckSplit = async () => {
    try {
      setChecking(true);
      setMessage("");

      if (!checkName) {
        throw new Error("Enter a split name.");
      }

      const contract = await getContract();

      const splitId = id(checkName);

      const details = await contract.getSplitDetails(splitId);

      const payees = details[0];
      const shares = details[1];
      const totalShares = details[2];
      const totalReceived = details[3];
      const exists = details[4];

      if (!exists) {
        setMessage(`Split "${checkName}" does not exist.`);
        return;
      }

      const shareText = payees
        .map(
          (payee: string, index: number) =>
            `${payee.slice(0, 6)}...${payee.slice(-4)}: ${shares[
              index
            ].toString()} shares`
        )
        .join(" | ");

      setMessage(
        `Split "${checkName}" exists | ${shareText} | Total shares: ${totalShares.toString()} | Total received: ${formatEther(
          totalReceived
        )} POL`
      );
    } catch (err: any) {
      setMessage(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Could not read royalty split."
      );
    } finally {
      setChecking(false);
    }
  };

  const handleReleasePayment = async () => {
    try {
      setReleasing(true);
      setMessage("");

      if (!releaseName || !releasePayee) {
        throw new Error(
          "Enter the split name and payee wallet address."
        );
      }

      const contract = await getContract();

      const splitId = id(releaseName);

      const pending = await contract.pendingPayment(
        splitId,
        releasePayee
      );

      if (pending === BigInt(0)) {
        throw new Error("This payee has no pending payment.");
      }

      const tx = await contract.release(
        splitId,
        releasePayee,
        AMOY_GAS
      );

      await tx.wait();

      setMessage(
        `${formatEther(pending)} POL released successfully`
      );

      setReleaseName("");
      setReleasePayee("");
    } catch (err: any) {
      setMessage(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Royalty release failed."
      );
    } finally {
      setReleasing(false);
    }
  };

  const handleReleaseAll = async () => {
    try {
      setReleasingAll(true);
      setMessage("");

      if (!releaseAllName) {
        throw new Error("Enter the split name.");
      }

      const contract = await getContract();

      const splitId = id(releaseAllName);

      const details = await contract.getSplitDetails(splitId);

      if (!details[4]) {
        throw new Error(
          `Royalty split "${releaseAllName}" does not exist.`
        );
      }

      const tx = await contract.releaseAll(
        splitId,
        AMOY_GAS
      );

      await tx.wait();

      setMessage(
        `All pending payments for "${releaseAllName}" released successfully`
      );

      setReleaseAllName("");
    } catch (err: any) {
      setMessage(
        err?.shortMessage ||
          err?.reason ||
          err?.message ||
          "Release all failed."
      );
    } finally {
      setReleasingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">
        Royalty Distribution
      </h2>

      {/* CREATE SPLIT */}
      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Create Royalty Split
        </p>

        <input
          type="text"
          placeholder="Split name"
          value={splitName}
          onChange={(e) => setSplitName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Payee addresses separated by commas"
          value={payeesInput}
          onChange={(e) => setPayeesInput(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Shares separated by commas, e.g. 70,30"
          value={sharesInput}
          onChange={(e) => setSharesInput(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          type="button"
          onClick={handleCreateSplit}
          disabled={creating}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create Split"}
        </button>
      </div>

      {/* DISTRIBUTE */}
      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Distribute Revenue
        </p>

        <input
          type="text"
          placeholder="Split name"
          value={distributionName}
          onChange={(e) => setDistributionName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          min="0"
          step="any"
          placeholder="Amount in POL"
          value={distributionAmount}
          onChange={(e) => setDistributionAmount(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          type="button"
          onClick={handleDistribute}
          disabled={distributing}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {distributing ? "Distributing..." : "Distribute Revenue"}
        </button>
      </div>

      {/* CHECK SPLIT */}
      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Check Split
        </p>

        <input
          type="text"
          placeholder="Split name"
          value={checkName}
          onChange={(e) => setCheckName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          type="button"
          onClick={handleCheckSplit}
          disabled={checking}
          className="w-full rounded-lg border border-neutral-700 px-4 py-2 font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {checking ? "Checking..." : "Check Split"}
        </button>
      </div>

      {/* RELEASE ONE */}
      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Release One Payee
        </p>

        <input
          type="text"
          placeholder="Split name"
          value={releaseName}
          onChange={(e) => setReleaseName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Payee wallet address"
          value={releasePayee}
          onChange={(e) => setReleasePayee(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          type="button"
          onClick={handleReleasePayment}
          disabled={releasing}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {releasing ? "Releasing..." : "Release Payment"}
        </button>
      </div>

      {/* RELEASE ALL */}
      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Release All Payments
        </p>

        <input
          type="text"
          placeholder="Split name"
          value={releaseAllName}
          onChange={(e) => setReleaseAllName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          type="button"
          onClick={handleReleaseAll}
          disabled={releasingAll}
          className="w-full rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {releasingAll ? "Releasing..." : "Release All"}
        </button>
      </div>

      {message && (
        <p className="break-words text-sm text-neutral-300">
          {message}
        </p>
      )}
    </div>
  );
}
