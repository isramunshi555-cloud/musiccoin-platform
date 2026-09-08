"use client";

import { useState } from "react";
import { 
  Coins, 
  TrendingUp, 
  Lock, 
  ShieldCheck 
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function StakingPage() {
  const { isConnected, connectWallet, musicBalance } = useWallet();

  const [stakeAmount, setStakeAmount] = useState("250");
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [isStaking, setIsStaking] = useState(false);
  const [activePositions, setActivePositions] = useState([
    {
      id: 0,
      amount: "500 MUSIC",
      duration: "90 Days",
      apy: "10% APY",
      earnedReward: "12.35 MUSIC",
      daysLeft: 42,
      status: "ACTIVE",
    },
    {
      id: 1,
      amount: "1,000 MUSIC",
      duration: "365 Days",
      apy: "25% APY",
      earnedReward: "68.50 MUSIC",
      daysLeft: 290,
      status: "ACTIVE",
    },
  ]);

  const pools = [
    { days: 30, apy: 5, bonus: "Tier 1 Priority Tickets" },
    { days: 90, apy: 10, bonus: "5% Festival Merch Discount" },
    { days: 180, apy: 15, bonus: "Free Backstage POAP & Lounge" },
    { days: 365, apy: 25, bonus: "Governance Voting + VIP Access" },
  ];

  const currentPool = pools.find((p) => p.days === selectedDuration) || pools[1];
  const numAmount = parseFloat(stakeAmount) || 0;
  const estimatedPeriodReward = ((numAmount * (currentPool.apy / 100) * selectedDuration) / 365).toFixed(2);

  const handleStake = () => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (numAmount <= 0) return;

    setIsStaking(true);
    setTimeout(() => {
      setIsStaking(false);
      const newPos = {
        id: activePositions.length,
        amount: `${numAmount} MUSIC`,
        duration: `${selectedDuration} Days`,
        apy: `${currentPool.apy}% APY`,
        earnedReward: "0.00 MUSIC",
        daysLeft: selectedDuration,
        status: "ACTIVE",
      };
      setActivePositions([newPos, ...activePositions]);
      setStakeAmount("");
      alert(`Successfully locked ${numAmount} MUSIC for ${selectedDuration} days at ${currentPool.apy}% APY!`);
    }, 1200);
  };

  const handleClaim = (_id: number) => {
    alert(`Accrued reward for position #${_id} claimed and minted to your wallet on Polygon!`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/30 px-3.5 py-1 text-xs font-semibold text-amber-300 mb-3">
          <Coins className="h-3.5 w-3.5" /> Native Fan Economy on Polygon
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          MUSIC Token Staking Hub
        </h1>
        <p className="mt-3 text-sm text-neutral-400">
          Lock MUSIC tokens to earn up to 25% APY rewards, priority ticket drops, backstage access, and festival governance power.
        </p>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
          <p className="text-xs text-neutral-400 font-medium">MUSIC Token Price</p>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">$0.45</p>
          <span className="text-[11px] text-emerald-400 font-semibold">+12.4% this week</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
          <p className="text-xs text-neutral-400 font-medium">Total Staking TVL</p>
          <p className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">4.85M</p>
          <span className="text-[11px] text-neutral-400">MUSIC Tokens Locked</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
          <p className="text-xs text-neutral-400 font-medium">Max Reward Rate</p>
          <p className="text-2xl sm:text-3xl font-black text-pink-400 mt-1">25% APY</p>
          <span className="text-[11px] text-purple-300">365-Day Lock Pool</span>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
          <p className="text-xs text-neutral-400 font-medium">Total Distributed</p>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-1">240K</p>
          <span className="text-[11px] text-emerald-400">MUSIC Rewards Claimed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Staking Widget */}
        <div className="lg:col-span-1 rounded-3xl border border-neutral-800 bg-neutral-900/80 backdrop-blur-xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-400" /> Stake MUSIC Tokens
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-neutral-400">Deposit Amount</span>
                <span className="text-neutral-400">Balance: <strong className="text-white">{musicBalance} MUSIC</strong></span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-base font-bold text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setStakeAmount("1000")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-neutral-800 px-2 py-1 text-[11px] font-semibold text-purple-300 hover:bg-neutral-700"
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Duration Selector */}
            <div>
              <label className="block text-xs text-neutral-400 mb-2">Select Lock Duration</label>
              <div className="grid grid-cols-2 gap-2">
                {pools.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setSelectedDuration(p.days)}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      selectedDuration === p.days
                        ? "border-purple-500 bg-purple-950/40 text-white"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">{p.days} Days</div>
                    <div className="text-sm font-black text-purple-300">{p.apy}% APY</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Lock Duration:</span>
                <span className="text-white font-semibold">{selectedDuration} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Reward Rate:</span>
                <span className="text-purple-400 font-bold">{currentPool.apy}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Est. Pool Reward:</span>
                <span className="text-emerald-400 font-bold">+{estimatedPeriodReward} MUSIC</span>
              </div>
              <div className="pt-2 border-t border-neutral-800/80 text-[11px] text-pink-300">
                ✨ Perks: {currentPool.bonus}
              </div>
            </div>

            <button
              onClick={handleStake}
              disabled={isStaking || numAmount <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-purple-600/25 hover:opacity-95 transition-all disabled:opacity-50"
            >
              {isStaking ? "Locking Tokens in Smart Contract..." : "Confirm Staking"}
            </button>
          </div>
        </div>

        {/* Active Positions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Active Staking Positions
            </h2>

            <div className="divide-y divide-neutral-800 text-xs">
              {activePositions.map((pos) => (
                <div key={pos.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{pos.amount}</span>
                      <span className="rounded bg-purple-950/80 border border-purple-500/30 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                        {pos.duration} ({pos.apy})
                      </span>
                    </div>
                    <p className="text-neutral-400 text-[11px]">
                      Lock expires in <strong className="text-neutral-200">{pos.daysLeft} days</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-neutral-400 block">Accrued Reward</span>
                      <span className="text-xs font-bold text-emerald-400">+{pos.earnedReward}</span>
                    </div>

                    <button
                      onClick={() => handleClaim(pos.id)}
                      className="rounded-xl bg-neutral-800 border border-neutral-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
                    >
                      Claim Reward
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-400" /> Staking Rules & Security
            </h3>
            <ul className="space-y-1.5 text-xs text-neutral-400 leading-relaxed">
              <li>• Staking contracts enforce non-custodial lockups via `FanToken.sol`.</li>
              <li>• Principal is securely claimable after the selected duration has elapsed.</li>
              <li>• Claiming rewards mints accrued interest without unlocking your staked principal.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
