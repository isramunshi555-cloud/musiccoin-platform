"use client";

import { useState } from "react";
import { Contract, parseEther } from "ethers";

import { connectWallet } from "@/lib/web3";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

const EVENT_TICKET_ABI = [
  "function createTier(uint256 eventId, string tierName, uint256 price, uint256 maxSupply, uint256 maxResalePrice, uint256 eventTimestamp, address organizer) returns (uint256)",
  "function buyTicket(uint256 tierId, string metadataURI) payable returns (uint256)",
  "function checkIn(uint256 ticketId)",
  "function tiers(uint256 tierId) view returns (uint256,string,uint256,uint256,uint256,uint256,address)",
  "function tickets(uint256 ticketId) view returns (uint256,uint256,bool)",
];

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

export default function EventTicketPanel() {
  const [message, setMessage] = useState("");

  const [eventId, setEventId] = useState("");
  const [tierName, setTierName] = useState("");
  const [price, setPrice] = useState("");
  const [maxSupply, setMaxSupply] = useState("");
  const [maxResalePrice, setMaxResalePrice] = useState("");
  const [eventTimestamp, setEventTimestamp] = useState("");

  const [tierId, setTierId] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  const [ticketId, setTicketId] = useState("");

  const [creating, setCreating] = useState(false);
  const [buying, setBuying] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const createTier = async () => {
    try {
      setCreating(true);
      setMessage("");

      if (
        !eventId ||
        !tierName ||
        !price ||
        !maxSupply ||
        !maxResalePrice ||
        !eventTimestamp
      ) {
        throw new Error("Fill all tier fields.");
      }

      const { signer, address, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.eventTicket,
        EVENT_TICKET_ABI,
        signer
      );

      const tx = await contract.createTier(
        BigInt(eventId),
        tierName,
        parseEther(price),
        BigInt(maxSupply),
        parseEther(maxResalePrice),
        BigInt(eventTimestamp),
        address,
        AMOY_GAS
      );

      await tx.wait();

      setMessage("Ticket tier created successfully");

      setEventId("");
      setTierName("");
      setPrice("");
      setMaxSupply("");
      setMaxResalePrice("");
      setEventTimestamp("");
    } catch (err: any) {
      setMessage(err?.message || "Tier creation failed.");
    } finally {
      setCreating(false);
    }
  };

  const buyTicket = async () => {
    try {
      setBuying(true);
      setMessage("");

      if (!tierId || !metadataURI) {
        throw new Error("Enter tier ID and metadata URI.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.eventTicket,
        EVENT_TICKET_ABI,
        signer
      );

      const tier = await contract.tiers(BigInt(tierId));
      const ticketPrice = tier[2];

      const tx = await contract.buyTicket(
        BigInt(tierId),
        metadataURI,
        {
          value: ticketPrice,
          ...AMOY_GAS,
        }
      );

      await tx.wait();

      setMessage(`Ticket purchased successfully from tier #${tierId}`);

      setTierId("");
      setMetadataURI("");
    } catch (err: any) {
      setMessage(err?.message || "Ticket purchase failed.");
    } finally {
      setBuying(false);
    }
  };

  const checkInTicket = async () => {
    try {
      setCheckingIn(true);
      setMessage("");

      if (!ticketId) {
        throw new Error("Enter ticket ID.");
      }

      const { signer, chainId } = await connectWallet();

      if (chainId !== 80002) {
        throw new Error("Please switch MetaMask to Polygon Amoy.");
      }

      const contract = new Contract(
        CONTRACT_ADDRESSES.eventTicket,
        EVENT_TICKET_ABI,
        signer
      );

      const tx = await contract.checkIn(
        BigInt(ticketId),
        AMOY_GAS
      );

      await tx.wait();

      setMessage(`Ticket #${ticketId} checked in successfully`);

      setTicketId("");
    } catch (err: any) {
      setMessage(err?.message || "Ticket check-in failed.");
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">
        Event Ticketing
      </h2>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Create Ticket Tier
        </p>

        <input
          type="number"
          placeholder="Event ID"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Tier name"
          value={tierName}
          onChange={(e) => setTierName(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          step="any"
          placeholder="Ticket price in POL"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          placeholder="Maximum supply"
          value={maxSupply}
          onChange={(e) => setMaxSupply(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          step="any"
          placeholder="Maximum resale price in POL"
          value={maxResalePrice}
          onChange={(e) => setMaxResalePrice(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="number"
          placeholder="Event timestamp"
          value={eventTimestamp}
          onChange={(e) => setEventTimestamp(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          onClick={createTier}
          disabled={creating}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Creating..." : "Create Tier"}
        </button>
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Buy Ticket
        </p>

        <input
          type="number"
          placeholder="Tier ID"
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <input
          type="text"
          placeholder="Ticket metadata URI"
          value={metadataURI}
          onChange={(e) => setMetadataURI(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          onClick={buyTicket}
          disabled={buying}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {buying ? "Buying..." : "Buy Ticket"}
        </button>
      </div>

      <div className="space-y-3 border-t border-neutral-800 pt-4">
        <p className="font-semibold text-white">
          Check In Ticket
        </p>

        <input
          type="number"
          placeholder="Ticket ID"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-white"
        />

        <button
          onClick={checkInTicket}
          disabled={checkingIn}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {checkingIn ? "Checking in..." : "Check In"}
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
