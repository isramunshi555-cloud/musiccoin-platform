"use client";

import { useState } from "react";
import { Contract } from "ethers";

import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const ARTIST_IDENTITY_ABI = [
  "function applyForVerification(string stageName, string metadataURI)",
  "function isArtistVerified(address artist) view returns (bool)",
  "function verifyArtist(address artistAddress, string stageName, string metadataURI, uint256 initialScore) returns (uint256)",
  "function getArtist(address artist) view returns (tuple(string stageName,string metadataURI,uint256 reputationScore,bool verified,uint256 tokenId))",
];

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

export default function ArtistIdentityPanel() {
  const [message, setMessage] = useState("");

  const [stageName, setStageName] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [applying, setApplying] = useState(false);

  const [verifyAddress, setVerifyAddress] = useState("");
  const [verifyStageName, setVerifyStageName] = useState("");
  const [verifyMetadataURI, setVerifyMetadataURI] = useState("");
  const [initialScore, setInitialScore] = useState("100");
  const [verifying, setVerifying] = useState(false);

  const applyForVerification = async () => {
    try {
      setApplying(true);
      setMessage("");

      if (!stageName || !metadataURI) {
        throw new Error("Enter stage name and metadata URI.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.artistIdentity,
        ARTIST_IDENTITY_ABI,
        signer
      );

      const tx = await contract.applyForVerification(
        stageName,
        metadataURI,
        AMOY_GAS
      );

      await tx.wait();

      setMessage("Artist verification application submitted successfully");

      setStageName("");
      setMetadataURI("");
    } catch (err: any) {
      setMessage(err?.message || "Artist application failed.");
    } finally {
      setApplying(false);
    }
  };

  const checkVerification = async () => {
    try {
      setMessage("");

      const { signer, address, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.artistIdentity,
        ARTIST_IDENTITY_ABI,
        signer
      );

      const verified = await contract.isArtistVerified(address);

      setMessage(
        verified
          ? "This wallet is a verified artist"
          : "This wallet is not verified yet"
      );
    } catch (err: any) {
      setMessage(err?.message || "Could not check verification.");
    }
  };

  const verifyArtist = async () => {
    try {
      setVerifying(true);
      setMessage("");

      if (
        !verifyAddress ||
        !verifyStageName ||
        !verifyMetadataURI ||
        !initialScore
      ) {
        throw new Error("Fill all verification fields.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.artistIdentity,
        ARTIST_IDENTITY_ABI,
        signer
      );

      const tx = await contract.verifyArtist(
        verifyAddress,
        verifyStageName,
        verifyMetadataURI,
        BigInt(initialScore),
        AMOY_GAS
      );

      await tx.wait();

      setMessage("Artist verified successfully");

      setVerifyAddress("");
      setVerifyStageName("");
      setVerifyMetadataURI("");
      setInitialScore("100");
    } catch (err: any) {
      setMessage(err?.message || "Artist verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">
        Artist Identity
      </h2>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Apply for Verification
        </p>

        <input
          type="text"
          placeholder="Stage name"
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Metadata URI"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          onClick={applyForVerification}
          disabled={applying}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {applying ? "Submitting..." : "Apply"}
        </button>

        <button
          onClick={checkVerification}
          className="w-full rounded-lg border border-neutral-700 px-4 py-2 font-semibold text-white hover:bg-neutral-800"
        >
          Check My Verification
        </button>
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Verify Artist
        </p>

        <input
          type="text"
          placeholder="Artist wallet address"
          value={verifyAddress}
          onChange={(e) => setVerifyAddress(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Stage name"
          value={verifyStageName}
          onChange={(e) => setVerifyStageName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Metadata URI"
          value={verifyMetadataURI}
          onChange={(e) => setVerifyMetadataURI(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          min="0"
          placeholder="Initial reputation score"
          value={initialScore}
          onChange={(e) => setInitialScore(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          onClick={verifyArtist}
          disabled={verifying}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {verifying ? "Verifying..." : "Verify Artist"}
        </button>
      </div>

      {message && (
        <p className="text-sm text-neutral-300">
          {message}
        </p>
      )}
    </div>
  );
}
