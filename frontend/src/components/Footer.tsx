import Link from "next/link";
import { Music, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-900 bg-neutral-950/60 py-12 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-900">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Music className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-white">MusicCoin</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Decentralized music festival platform eliminating ticketing fraud, scalping, and payment delays through smart contracts and Polygon blockchain.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/events" className="hover:text-purple-400 transition-colors">Festival Lineups</Link></li>
              <li><Link href="/marketplace" className="hover:text-purple-400 transition-colors">Music NFT Studio</Link></li>
              <li><Link href="/staking" className="hover:text-purple-400 transition-colors">MUSIC Staking Hub</Link></li>
              <li><Link href="/tickets" className="hover:text-purple-400 transition-colors">Fan NFT Passes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">For Creators</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-purple-400 transition-colors">Artist DID Verification</Link></li>
              <li><Link href="/dashboard" className="hover:text-purple-400 transition-colors">Instant Royalty Splits</Link></li>
              <li><Link href="/scanner" className="hover:text-purple-400 transition-colors">Gatekeeper QR Scanner</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">Security & Trust</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Audited OpenZeppelin Contracts</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <Zap className="h-4 w-4" />
                <span>Polygon PoS Sub-second Finality</span>
              </div>
              <div className="flex items-center gap-2 text-pink-400">
                <Sparkles className="h-4 w-4" />
                <span>ERC-2981 Secondary Royalties</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400">
          <p>© 2026 MusicCoin Platform. Open-source decentralized entertainment.</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <span>Polygon Amoy Testnet</span>
            <span>Solidity ^0.8.24</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
