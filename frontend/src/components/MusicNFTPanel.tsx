"use client";

import { useState } from "react";
import { Contract, parseEther } from "ethers";

import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const MUSIC_NFT_ABI = [
  "function totalMinted() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function mintMusicNFT(address recipient, string uri, address royaltyReceiver, uint96 royaltyFeeBps, uint8 category) returns (uint256)",
  "function listNFT(uint256 tokenId, uint256 price)",
];

export default function MusicNFTPanel() {
  const [message, setMessage] = useState("");

  const [uri, setUri] = useState("");
  const [royalty, setRoyalty] = useState("500");
  const [category, setCategory] = useState("0");
  const [minting, setMinting] = useState(false);

  const [listTokenId, setListTokenId] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [listing, setListing] = useState(false);

  const checkNFTContract = async () => {
    try {
      setMessage("");

      const { signer, chainId } = await connectWallet();

      if (chainId !== 31337) {
        throw new Error("Please switch MetaMask to Hardhat Local network.");
      }

      const musicNFT = new Contract(
        CONTRACT_ADDRESSES.musicNFT,
        MUSIC_NFT_ABI,
        signer
      );

      const totalMinted = await musicNFT.totalMinted();

      setMessage(`Total Music NFTs minted: ${totalMinted.toString()}`);
    } catch (err: any) {
      setMessage(
        err?.message || "Could not connect to Music NFT contract."
      );
    }
  };

  const mintNFT = async () => {
    try {
      setMinting(true);
      setMessage("");

      if (!uri) {
        throw new Error("Enter an NFT metadata URI.");
      }

      const { signer, address, chainId } = await connectWallet();

      if (chainId !== 31337) {
        throw new Error("Please switch MetaMask to Hardhat Local network.");
      }

      const musicNFT = new Contract(
        CONTRACT_ADDRESSES.musicNFT,
        MUSIC_NFT_ABI,
        signer
      );

      const tx = await musicNFT.mintMusicNFT(
        address,
        uri,
        address,
        BigInt(royalty),
        Number(category)
      );

      await tx.wait();

      const totalMinted = await musicNFT.totalMinted();

      setMessage(
        `NFT minted successfully. Token ID: ${totalMinted.toString()}`
      );

      setUri("");
    } catch (err: any) {
      setMessage(err?.message || "NFT minting failed.");
    } finally {
      setMinting(false);
    }
  };

  const listNFTForSale = async () => {
    try {
      setListing(true);
      setMessage("");

      if (!listTokenId || !listPrice) {
        throw new Error("Enter token ID and sale price.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 31337) {
        throw new Error("Please switch MetaMask to Hardhat Local network.");
      }

      const musicNFT = new Contract(
        CONTRACT_ADDRESSES.musicNFT,
        MUSIC_NFT_ABI,
        signer
      );

      const tx = await musicNFT.listNFT(
        BigInt(listTokenId),
        parseEther(listPrice)
      );

      await tx.wait();

      setMessage(
        `NFT #${listTokenId} listed successfully for ${listPrice} ETH/POL`
      );

      setListTokenId("");
      setListPrice("");
    } catch (err: any) {
      setMessage(err?.message || "NFT listing failed.");
    } finally {
      setListing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">
        Music NFT
      </h2>

      <button
        onClick={checkNFTContract}
        className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
      >
        Check NFT Contract
      </button>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Mint Music NFT
        </p>

        <input
          type="text"
          placeholder="NFT metadata URI"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
        >
          <option value="0">Song</option>
          <option value="1">Album</option>
          <option value="2">VIP Pass</option>
          <option value="3">Collectible</option>
        </select>

        <select
          value={royalty}
          onChange={(e) => setRoyalty(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
        >
          <option value="500">5% Royalty</option>
          <option value="1000">10% Royalty</option>
          <option value="1500">15% Royalty</option>
          <option value="2000">20% Royalty</option>
          <option value="2500">25% Royalty</option>
        </select>

        <button
          onClick={mintNFT}
          disabled={minting}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {minting ? "Minting..." : "Mint NFT"}
        </button>
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          List NFT for Sale
        </p>

        <input
          type="number"
          min="1"
          placeholder="Token ID"
          value={listTokenId}
          onChange={(e) => setListTokenId(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
        />

        <input
          type="number"
          min="0"
          step="any"
          placeholder="Sale price in ETH/POL"
          value={listPrice}
          onChange={(e) => setListPrice(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-purple-500"
        />

        <button
          onClick={listNFTForSale}
          disabled={listing}
          className="w-full rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {listing ? "Listing..." : "List NFT"}
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