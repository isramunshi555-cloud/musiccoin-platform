"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Check,
  Coins,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { useWallet } from "@/context/WalletContext";

const nftItems = [
  {
    id: 1,
    title: "Cybernetic Dreams (Unreleased VIP Mix)",
    artist: "DJ Cyberpunk",
    category: "SONG",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
    priceMusic: "150 MUSIC",
    pricePol: "0.02 POL",
    royalty: "10% to Artist",
    supply: "1 of 25",
  },
  {
    id: 2,
    title: "Neon Horizon - Genesis Album Pass",
    artist: "Neon Horizon",
    category: "ALBUM",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80",
    priceMusic: "400 MUSIC",
    pricePol: "0.05 POL",
    royalty: "8% to Artist / Producer",
    supply: "1 of 50",
  },
  {
    id: 3,
    title: "Amsterdam 2026 Lifetime VIP Pass",
    artist: "Cyberbeats Festival",
    category: "VIP_PASS",
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80",
    priceMusic: "1,200 MUSIC",
    pricePol: "0.15 POL",
    royalty: "5% to Platform DAO",
    supply: "1 of 10",
  },
  {
    id: 4,
    title: "Synthetix Live Bass Stem #04",
    artist: "Synthetix",
    category: "SONG",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    priceMusic: "90 MUSIC",
    pricePol: "0.012 POL",
    royalty: "12% to Synthetix",
    supply: "1 of 100",
  },
  {
    id: 5,
    title: "Tokyo Underground Golden Ticket",
    artist: "SubSonic",
    category: "VIP_PASS",
    image:
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    priceMusic: "650 MUSIC",
    pricePol: "0.08 POL",
    royalty: "7% to Artists",
    supply: "1 of 20",
  },
  {
    id: 6,
    title: "Solar Flare Anthem 3D Audio Stems",
    artist: "Aura Waves",
    category: "SONG",
    image:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
    priceMusic: "180 MUSIC",
    pricePol: "0.025 POL",
    royalty: "10% to Aura Waves",
    supply: "1 of 30",
  },
];

const categoryTabs = [
  { key: "ALL", label: "All Items" },
  { key: "SONG", label: "Audio & Songs" },
  { key: "ALBUM", label: "Album Passes" },
  { key: "VIP_PASS", label: "VIP Passes" },
];

export default function MarketplacePage() {
  const { isConnected, connectWallet } = useWallet();

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [purchasedId, setPurchasedId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filteredItems = nftItems.filter(
    (item) =>
      selectedCategory === "ALL" || item.category === selectedCategory,
  );

  function togglePlay(id: number) {
    setPlayingId((currentId) => (currentId === id ? null : id));
  }

  function handleBuyNFT(id: number) {
    if (!isConnected) {
      connectWallet();
      return;
    }

    setPurchasedId(id);

    window.setTimeout(() => {
      setPurchasedId(null);
      window.alert(
        "NFT successfully collected! Added to your Web3 collection.",
      );
    }, 1200);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <section className="mx-auto mb-10 max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-950/30 px-3.5 py-1 text-xs font-semibold text-pink-300">
          <Sparkles className="h-3.5 w-3.5" />
          ERC-2981 Automated Royalties
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Music &amp; Collectible NFT Marketplace
        </h1>

        <p className="mt-3 text-sm text-neutral-400">
          Collect exclusive audio tracks, festival passes and backstage
          memorabilia directly from verified artists.
        </p>
      </section>

      <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
        {categoryTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              selectedCategory === tab.key
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                : "border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 transition-all hover:border-purple-500/40"
          >
            <div>
              <div className="relative h-60 w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <button
                  type="button"
                  onClick={() => togglePlay(item.id)}
                  className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-transform hover:scale-110"
                  title={
                    playingId === item.id
                      ? "Pause audio preview"
                      : "Play audio preview"
                  }
                  aria-label={
                    playingId === item.id
                      ? `Pause preview for ${item.title}`
                      : `Play preview for ${item.title}`
                  }
                >
                  {playingId === item.id ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="ml-0.5 h-5 w-5" />
                  )}
                </button>

                <div className="absolute right-3 top-3 rounded-md bg-neutral-950/80 px-2.5 py-1 font-mono text-[11px] text-purple-300 backdrop-blur-md">
                  {item.supply}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-neutral-400">
                  <span className="font-semibold text-purple-400">
                    {item.artist}
                  </span>

                  <span className="flex items-center gap-1 text-right text-emerald-400">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    {item.royalty}
                  </span>
                </div>

                <h2 className="text-base font-bold text-white transition-colors group-hover:text-purple-300">
                  {item.title}
                </h2>
              </div>
            </div>

            <div className="p-5 pt-0">
              <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
                <div>
                  <span className="block text-sm font-bold text-white">
                    {item.priceMusic}
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {item.pricePol}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyNFT(item.id)}
                  disabled={purchasedId === item.id}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/20 transition-colors hover:bg-purple-500 disabled:cursor-wait disabled:opacity-70"
                >
                  {purchasedId === item.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      Settling...
                    </>
                  ) : (
                    <>
                      <Coins className="h-3.5 w-3.5" />
                      Buy NFT
                    </>
                  )}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}