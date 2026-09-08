"use client";

import Link from "next/link";
import { 
  Sparkles, 
  Ticket, 
  ShieldCheck, 
  Coins, 
  Calendar, 
  ArrowRight, 
  Zap
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function HomePage() {
  const { isConnected, connectWallet } = useWallet();

  const featuredFestivals = [
    {
      id: 1,
      title: "Cyberbeats Electronic Festival 2026",
      city: "Amsterdam",
      country: "Netherlands",
      dates: "Aug 14 - 16, 2026",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
      headliners: ["DJ Cyberpunk", "Synthetix", "Neon Horizon"],
      minPrice: "0.04 POL",
      slug: "cyberbeats-amsterdam-2026",
      tag: "Trending",
    },
    {
      id: 2,
      title: "Solana Sunsets Oasis",
      city: "Miami",
      country: "USA",
      dates: "Sep 25 - 28, 2026",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      headliners: ["Aura Waves", "Midnight Groove", "K-Pulse"],
      minPrice: "0.06 POL",
      slug: "solana-sunsets-miami-2026",
      tag: "Selling Fast",
    },
    {
      id: 3,
      title: "Tokyo Underground Bass Summit",
      city: "Tokyo",
      country: "Japan",
      dates: "Oct 10 - 12, 2026",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
      headliners: ["SubSonic", "Voltage", "Hikari Live"],
      minPrice: "0.05 POL",
      slug: "tokyo-bass-summit-2026",
      tag: "NFT VIP Included",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background Neon Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-purple-600/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-96 -left-40 h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[130px]" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md mb-8">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>Polygon PoS Smart Festival Ecosystem</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Music Festivals, Powered by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
              Smart Contracts
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-neutral-400 leading-relaxed">
            Eliminate ticket scalpers, counterfeit passes, and payment delays. Collect immutable NFT tickets, stream instant royalties to artists, and stake <span className="text-purple-300 font-semibold">MUSIC</span> tokens for VIP festival perks.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-600/25 hover:opacity-95 transition-all hover:scale-105"
            >
              <Ticket className="h-4 w-4" />
              Explore Festivals
            </Link>

            {!isConnected ? (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900/80 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-neutral-200 hover:bg-neutral-800 transition-all"
              >
                <Coins className="h-4 w-4 text-purple-400" />
                Connect Wallet
              </button>
            ) : (
              <Link
                href="/staking"
                className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/40 backdrop-blur-md px-6 py-3.5 text-sm font-semibold text-purple-200 hover:bg-purple-900/40 transition-all"
              >
                <Coins className="h-4 w-4 text-purple-400" />
                Stake MUSIC Tokens
              </Link>
            )}
          </div>
        </div>

        {/* Live Ecosystem Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-xl">
          <div className="text-center md:border-r border-neutral-800/80">
            <p className="text-2xl sm:text-3xl font-black text-white">$1.2M+</p>
            <p className="text-xs text-neutral-400 font-medium mt-1">Ticket Volume Settled</p>
          </div>
          <div className="text-center md:border-r border-neutral-800/80">
            <p className="text-2xl sm:text-3xl font-black text-purple-400">0%</p>
            <p className="text-xs text-neutral-400 font-medium mt-1">Ticket Fraud & Scalping</p>
          </div>
          <div className="text-center md:border-r border-neutral-800/80">
            <p className="text-2xl sm:text-3xl font-black text-pink-400">100%</p>
            <p className="text-xs text-neutral-400 font-medium mt-1">Instant Artist Payouts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-black text-amber-300">25% APY</p>
            <p className="text-xs text-neutral-400 font-medium mt-1">Max Staking Rewards</p>
          </div>
        </div>
      </section>

      {/* Featured Festivals Grid */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Featured Worldwide Festivals
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Verifiable NFT passes with built-in anti-scalping price ceilings.
            </p>
          </div>
          <Link
            href="/events"
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredFestivals.map((fest) => (
            <div
              key={fest.id}
              className="group overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:border-purple-500/40 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={fest.image}
                  alt={fest.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-purple-600/90 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
                    {fest.tag}
                  </span>
                </div>
                <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-200">
                  From {fest.minPrice}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    <span>{fest.dates}</span>
                    <span>•</span>
                    <span>{fest.city}, {fest.country}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {fest.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {fest.headliners.map((artist, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-neutral-800/80 px-2 py-0.5 text-[11px] font-medium text-neutral-300"
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Anti-Scalping Guard
                  </span>
                  <Link
                    href={`/events/${fest.slug}`}
                    className="rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white px-3.5 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    Get Passes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Features */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-3xl font-extrabold text-white">
            Architecture Designed for Fair Live Music
          </h2>
          <p className="mt-3 text-neutral-400 text-sm">
            Powered by 5 audited smart contracts working in unison to automate tickets, identity, and royalties.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-5">
              <Ticket className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart NFT Ticketing</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every pass is an on-chain NFT on Polygon with anti-scalping price caps. Gatekeepers verify dynamic cryptographic QR signatures in milliseconds.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 mb-5">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Royalty Splits</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Smart contract splitters automatically distribute festival revenues to Artists, Producers, and Labels on secondary sales conforming to ERC-2981.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 mb-5">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">MUSIC Staking & Rewards</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Stake native MUSIC tokens for up to 25% APY rewards, priority ticket queues, governance voting rights, and exclusive festival merchandise.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
