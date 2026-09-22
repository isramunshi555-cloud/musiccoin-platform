"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { 
  Music, 
  Ticket, 
  Sparkles, 
  Coins, 
  QrCode, 
  User, 
  Wallet, 
  LogOut,
  Calendar
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    musicBalance,
    network,
    error: walletError,
    connectWallet,
    disconnectWallet,
  } = useWallet();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("access_token"));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setHasToken(false);
    router.push("/login");
  };

  const navLinks = [
    { name: "Festivals", href: "/events", icon: Calendar },
    { name: "Marketplace", href: "/marketplace", icon: Sparkles },
    { name: "Staking", href: "/staking", icon: Coins },
    { name: "My Tickets", href: "/tickets", icon: Ticket },
    { name: "Gate Scanner", href: "/scanner", icon: QrCode },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-neutral-950">
              <Music className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Music<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Coin</span>
            </span>
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-neutral-400 -mt-1">
              Polygon PoS
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800/60">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions & Web3 Wallet */}
        <div className="flex items-center gap-3">
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs">
                <span className="text-purple-400 font-bold">
                  {musicBalance === "Not configured"
                    ? "MUSIC not configured"
                    : `${musicBalance} MUSIC`}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-300">{balance} POL</span>
              </div>
              <button
                onClick={disconnectWallet}
                className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/30 px-3.5 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/40 transition-colors"
                title={`${network}. Click to disconnect wallet`}
              >
                <Wallet className="h-3.5 w-3.5 text-purple-400" />
                <span>{address.slice(0, 6)}...{address.slice(-4)}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => void connectWallet()}
              disabled={isConnecting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/25 hover:opacity-95 transition-opacity disabled:cursor-wait disabled:opacity-60"
            >
              <Wallet className="h-3.5 w-3.5" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}

          {walletError && (
            <span
              className="hidden max-w-56 text-xs text-red-300 xl:block"
              title={walletError}
            >
              {walletError}
            </span>
          )}

          {hasToken ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-neutral-800 bg-neutral-900 p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
