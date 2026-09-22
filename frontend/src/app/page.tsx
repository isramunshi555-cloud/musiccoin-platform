"use client";

import Image from "next/image";
import Link from "next/link";
import WalletConnect from "@/components/WalletConnect";
import MusicNFTPanel from "@/components/MusicNFTPanel";

import {
  ArrowRight,
  Calendar,
  Coins,
  ShieldCheck,
  Sparkles,
  Ticket,
  Zap,
} from "lucide-react";

const featuredFestivals = [
  {
    id: 1,
    title: "Cyberbeats Electronic Festival 2026",
    city: "Amsterdam",
    country: "Netherlands",
    dates: "Aug 14 - 16, 2026",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
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
    image:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
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
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    headliners: ["SubSonic", "Voltage", "Hikari Live"],
    minPrice: "0.05 POL",
    slug: "tokyo-bass-summit-2026",
    tag: "NFT VIP Included",
  },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[140px]" />

      <div className="pointer-events-none absolute -left-40 top-96 h-[400px] w-[600px] rounded-full bg-indigo-600/10 blur-[130px]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:pb-28 lg:pt-24">
        <div className="text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>Polygon PoS Smart Festival Ecosystem</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Music Festivals, Powered by{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Smart Contracts
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Eliminate ticket scalpers, counterfeit passes and payment delays.
            Collect immutable NFT tickets, stream instant royalties to artists,
            and stake{" "}
            <span className="font-semibold text-purple-300">MUSIC</span>{" "}
            tokens for VIP festival perks.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/events"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-600/25 transition-all hover:scale-105 hover:opacity-95"
            >
              <Ticket className="h-4 w-4" />
              Explore Festivals
            </Link>
          </div>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-left backdrop-blur-xl">
            <WalletConnect />
          </div>

          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-left backdrop-blur-xl">
            <MusicNFTPanel />
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-xl md:grid-cols-4">
          <div className="text-center md:border-r md:border-neutral-800/80">
            <p className="text-2xl font-black text-white sm:text-3xl">
              $1.2M+
            </p>

            <p className="mt-1 text-xs font-medium text-neutral-400">
              Ticket Volume Settled
            </p>
          </div>

          <div className="text-center md:border-r md:border-neutral-800/80">
            <p className="text-2xl font-black text-purple-400 sm:text-3xl">
              0%
            </p>

            <p className="mt-1 text-xs font-medium text-neutral-400">
              Ticket Fraud &amp; Scalping
            </p>
          </div>

          <div className="text-center md:border-r md:border-neutral-800/80">
            <p className="text-2xl font-black text-pink-400 sm:text-3xl">
              100%
            </p>

            <p className="mt-1 text-xs font-medium text-neutral-400">
              Instant Artist Payouts
            </p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-black text-amber-300 sm:text-3xl">
              25% APY
            </p>

            <p className="mt-1 text-xs font-medium text-neutral-400">
              Max Staking Rewards
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Featured Worldwide Festivals
            </h2>

            <p className="mt-1 text-sm text-neutral-400">
              Verifiable NFT passes with built-in anti-scalping price ceilings.
            </p>
          </div>

          <Link
            href="/events"
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredFestivals.map((festival) => (
            <article
              key={festival.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 transition-all duration-300 hover:border-purple-500/40"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={festival.image}
                  alt={festival.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <div className="absolute left-3 top-3">
                  <span className="rounded-full bg-purple-600/90 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {festival.tag}
                  </span>
                </div>

                <div className="absolute bottom-3 right-3 rounded-lg bg-neutral-950/80 px-2.5 py-1 text-xs font-medium text-neutral-200 backdrop-blur-md">
                  From {festival.minPrice}
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-neutral-400">
                    <Calendar className="h-3.5 w-3.5 text-purple-400" />
                    <span>{festival.dates}</span>
                    <span>•</span>
                    <span>
                      {festival.city}, {festival.country}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white transition-colors group-hover:text-purple-300">
                    {festival.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {festival.headliners.map((artist) => (
                      <span
                        key={artist}
                        className="rounded-md bg-neutral-800/80 px-2 py-0.5 text-[11px] font-medium text-neutral-300"
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-800/60 pt-4">
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Anti-Scalping Guard
                  </span>

                  <Link
                    href={`/events/${festival.slug}`}
                    className="flex items-center gap-1 rounded-xl bg-purple-600/20 px-3.5 py-1.5 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-600 hover:text-white"
                  >
                    Get Passes
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Architecture Designed for Fair Live Music
          </h2>

          <p className="mt-3 text-sm text-neutral-400">
            Powered by audited smart contracts working in unison to automate
            tickets, identity and royalties.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Ticket className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-bold text-white">
              Smart NFT Ticketing
            </h3>

            <p className="text-xs leading-relaxed text-neutral-400">
              Every pass can become an on-chain NFT on Polygon with
              anti-scalping price caps. Gatekeepers verify secure QR codes in
              seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
              <Zap className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-bold text-white">
              Instant Royalty Splits
            </h3>

            <p className="text-xs leading-relaxed text-neutral-400">
              Smart contracts can distribute festival revenues to artists,
              producers and labels on eligible primary and secondary sales.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 backdrop-blur-md">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Coins className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-bold text-white">
              MUSIC Staking &amp; Rewards
            </h3>

            <p className="text-xs leading-relaxed text-neutral-400">
              Stake MUSIC tokens for rewards, priority ticket queues,
              governance voting and exclusive festival benefits.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}