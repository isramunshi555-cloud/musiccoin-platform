"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BrowserProvider,
  Contract,
  Eip1193Provider,
  formatUnits,
  parseUnits,
} from "ethers";
import {
  Coins,
  Lock,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

const FAN_TOKEN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function stake(uint256 amount, uint256 lockDuration)",
  "function claimReward(uint256 positionId)",
  "function unstake(uint256 positionId)",
  "function calculateReward(address user, uint256 positionId) view returns (uint256)",
  "function getUserStakeCount(address user) view returns (uint256)",
  "function userStakes(address user, uint256 positionId) view returns (uint256 amount, uint256 startTime, uint256 lockDuration, uint256 rewardRateBps, uint256 lastClaimTime, bool active)",
];

const SECONDS_PER_DAY = 86_400;

const AMOY_GAS = {
  maxPriorityFeePerGas: BigInt("30000000000"),
  maxFeePerGas: BigInt("60000000000"),
};

const POOLS = [
  {
    days: 30,
    apy: 5,
    bonus: "Tier 1 Priority Tickets",
  },
  {
    days: 90,
    apy: 10,
    bonus: "5% Festival Merch Discount",
  },
  {
    days: 180,
    apy: 15,
    bonus: "Free Backstage POAP & Lounge",
  },
  {
    days: 365,
    apy: 25,
    bonus: "Governance Voting + VIP Access",
  },
];

interface StakingPosition {
  id: number;
  amount: string;
  durationDays: number;
  apy: number;
  earnedReward: string;
  daysLeft: number;
  active: boolean;
  canUnstake: boolean;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message
    );
  }

  return "The blockchain transaction failed.";
}

function getInjectedProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  return new BrowserProvider(
    window.ethereum as unknown as Eip1193Provider
  );
}

export default function StakingPage() {
  const {
    address,
    isConnected,
    connectWallet,
  } = useWallet();

  const [stakeAmount, setStakeAmount] =
    useState("100");
  const [selectedDuration, setSelectedDuration] =
    useState(30);
  const [tokenBalance, setTokenBalance] =
    useState("0");
  const [totalStaked, setTotalStaked] =
    useState("0");
  const [activePositions, setActivePositions] =
    useState<StakingPosition[]>([]);
  const [isLoading, setIsLoading] =
    useState(false);
  const [pendingAction, setPendingAction] =
    useState("");
  const [error, setError] = useState("");

  const tokenAddress =
    process.env.NEXT_PUBLIC_MUSIC_TOKEN_ADDRESS;

  const currentPool =
    POOLS.find(
      (pool) => pool.days === selectedDuration
    ) ?? POOLS[0];

  const numericAmount =
    Number.parseFloat(stakeAmount) || 0;

  const estimatedReward = useMemo(() => {
    return (
      (numericAmount *
        (currentPool.apy / 100) *
        selectedDuration) /
      365
    ).toFixed(4);
  }, [
    currentPool.apy,
    numericAmount,
    selectedDuration,
  ]);

  const loadBlockchainData = useCallback(
    async () => {
      if (
        !isConnected ||
        !address ||
        !tokenAddress
      ) {
        setActivePositions([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const provider = getInjectedProvider();

        const contract = new Contract(
          tokenAddress,
          FAN_TOKEN_ABI,
          provider
        );

        const [rawBalance, rawTotal, rawCount] =
          await Promise.all([
            contract.balanceOf(address),
            contract.totalStaked(),
            contract.getUserStakeCount(address),
          ]);

        setTokenBalance(
          formatUnits(rawBalance, 18)
        );

        setTotalStaked(
          formatUnits(rawTotal, 18)
        );

        const count = Number(rawCount);
        const now = Math.floor(Date.now() / 1000);

        const positions =
          await Promise.all(
            Array.from(
              { length: count },
              async (_, index) => {
                const [position, reward] =
                  await Promise.all([
                    contract.userStakes(
                      address,
                      index
                    ),
                    contract.calculateReward(
                      address,
                      index
                    ),
                  ]);

                const amount =
                  position.amount as bigint;

                const startTime = Number(
                  position.startTime
                );

                const lockDuration = Number(
                  position.lockDuration
                );

                const rewardRateBps = Number(
                  position.rewardRateBps
                );

                const active =
                  position.active as boolean;

                const endTime =
                  startTime + lockDuration;

                const secondsLeft = Math.max(
                  0,
                  endTime - now
                );

                return {
                  id: index,
                  amount: formatUnits(
                    amount,
                    18
                  ),
                  durationDays: Math.round(
                    lockDuration /
                      SECONDS_PER_DAY
                  ),
                  apy:
                    rewardRateBps / 100,
                  earnedReward:
                    formatUnits(
                      reward,
                      18
                    ),
                  daysLeft: Math.ceil(
                    secondsLeft /
                      SECONDS_PER_DAY
                  ),
                  active,
                  canUnstake:
                    active && now >= endTime,
                };
              }
            )
          );

        setActivePositions(
          positions
            .filter(
              (position) =>
                position.active
            )
            .reverse()
        );
      } catch (loadError) {
        console.error(
          "Unable to load staking data",
          loadError
        );

        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      address,
      isConnected,
      tokenAddress,
    ]
  );

  useEffect(() => {
    void loadBlockchainData();
  }, [loadBlockchainData]);

  async function getWritableContract() {
    if (!tokenAddress) {
      throw new Error(
        "MUSIC token address is not configured."
      );
    }

    const provider = getInjectedProvider();

    const signer = await provider.getSigner();

    return new Contract(
      tokenAddress,
      FAN_TOKEN_ABI,
      signer
    );
  }

  async function handleStake() {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (
      numericAmount <= 0 ||
      !Number.isFinite(numericAmount)
    ) {
      setError(
        "Enter a valid MUSIC amount."
      );

      return;
    }

    if (
      numericAmount >
      Number.parseFloat(tokenBalance)
    ) {
      setError(
        "The staking amount is greater than your MUSIC balance."
      );

      return;
    }

    setPendingAction("stake");
    setError("");

    try {
      const contract =
        await getWritableContract();

      const amount = parseUnits(
        stakeAmount,
        18
      );

      const lockDuration =
        BigInt(
          selectedDuration *
            SECONDS_PER_DAY
        );

      const transaction =
        await contract.stake(
          amount,
          lockDuration,
          AMOY_GAS
        );

      await transaction.wait();

      setStakeAmount("");

      await loadBlockchainData();

      alert(
        `${numericAmount} MUSIC was successfully staked for ${selectedDuration} days.`
      );
    } catch (stakeError) {
      console.error(
        "Staking failed",
        stakeError
      );

      setError(
        getErrorMessage(stakeError)
      );
    } finally {
      setPendingAction("");
    }
  }

  async function handleClaim(
    positionId: number
  ) {
    setPendingAction(
      `claim-${positionId}`
    );

    setError("");

    try {
      const contract =
        await getWritableContract();

      const transaction =
        await contract.claimReward(
          positionId,
          AMOY_GAS
        );

      await transaction.wait();

      await loadBlockchainData();

      alert(
        "The available staking reward was claimed."
      );
    } catch (claimError) {
      console.error(
        "Reward claim failed",
        claimError
      );

      setError(
        getErrorMessage(claimError)
      );
    } finally {
      setPendingAction("");
    }
  }

  async function handleUnstake(
    positionId: number
  ) {
    setPendingAction(
      `unstake-${positionId}`
    );

    setError("");

    try {
      const contract =
        await getWritableContract();

      const transaction =
        await contract.unstake(
          positionId,
          AMOY_GAS
        );

      await transaction.wait();

      await loadBlockchainData();

      alert(
        "The staked MUSIC and available reward were returned to your wallet."
      );
    } catch (unstakeError) {
      console.error(
        "Unstaking failed",
        unstakeError
      );

      setError(
        getErrorMessage(unstakeError)
      );
    } finally {
      setPendingAction("");
    }
  }

  function useMaximumBalance() {
    const normalized =
      Number.parseFloat(tokenBalance);

    if (Number.isFinite(normalized)) {
      setStakeAmount(
        normalized.toString()
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-950/30 px-3.5 py-1 text-xs font-semibold text-amber-300">
          <Coins className="h-3.5 w-3.5" />
          Real Blockchain Staking
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          MUSIC Token Staking Hub
        </h1>

        <p className="mt-3 text-sm text-neutral-400">
          Lock MUSIC tokens using the
          FanToken smart contract and earn
          blockchain-calculated rewards.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric
          label="Wallet Balance"
          value={`${tokenBalance} MUSIC`}
          color="text-white"
        />

        <Metric
          label="Total Staked"
          value={`${totalStaked} MUSIC`}
          color="text-purple-400"
        />

        <Metric
          label="Maximum Rate"
          value="25% APY"
          color="text-pink-400"
        />

        <Metric
          label="Your Positions"
          value={activePositions.length.toString()}
          color="text-emerald-400"
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {!tokenAddress && (
        <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-200">
          NEXT_PUBLIC_MUSIC_TOKEN_ADDRESS
          is not configured.
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-2xl lg:col-span-1">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <Lock className="h-4 w-4 text-purple-400" />
            Stake MUSIC Tokens
          </h2>

          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-neutral-400">
                  Deposit Amount
                </span>

                <span className="text-neutral-400">
                  Balance:{" "}
                  <strong className="text-white">
                    {tokenBalance} MUSIC
                  </strong>
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stakeAmount}
                  onChange={(event) =>
                    setStakeAmount(
                      event.target.value
                    )
                  }
                  placeholder="0.00"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-base font-bold text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={
                    useMaximumBalance
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-neutral-800 px-2 py-1 text-[11px] font-semibold text-purple-300 hover:bg-neutral-700"
                >
                  MAX
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-neutral-400">
                Select Lock Duration
              </p>

              <div className="grid grid-cols-2 gap-2">
                {POOLS.map((pool) => (
                  <button
                    key={pool.days}
                    type="button"
                    onClick={() =>
                      setSelectedDuration(
                        pool.days
                      )
                    }
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      selectedDuration ===
                      pool.days
                        ? "border-purple-500 bg-purple-950/40 text-white"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {pool.days} Days
                    </div>

                    <div className="text-sm font-black text-purple-300">
                      {pool.apy}% APY
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 text-xs">
              <SummaryRow
                label="Lock Duration"
                value={`${selectedDuration} Days`}
              />

              <SummaryRow
                label="Reward Rate"
                value={`${currentPool.apy}% APY`}
              />

              <SummaryRow
                label="Estimated Reward"
                value={`+${estimatedReward} MUSIC`}
              />

              <div className="border-t border-neutral-800 pt-2 text-[11px] text-pink-300">
                ✨ Perks:{" "}
                {currentPool.bonus}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleStake()
              }
              disabled={
                pendingAction !== "" ||
                numericAmount <= 0 ||
                !tokenAddress
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-xs font-bold text-white shadow-xl shadow-purple-600/25 transition-all hover:opacity-95 disabled:opacity-50"
            >
              {pendingAction === "stake"
                ? "Waiting for Blockchain..."
                : isConnected
                  ? "Confirm Real Staking"
                  : "Connect Wallet"}
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Active Blockchain Positions
              </h2>

              <button
                type="button"
                onClick={() =>
                  void loadBlockchainData()
                }
                disabled={isLoading}
                className="rounded-lg border border-neutral-700 bg-neutral-800 p-2 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
                aria-label="Refresh positions"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    isLoading
                      ? "animate-spin"
                      : ""
                  }`}
                />
              </button>
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                Reading positions from the
                blockchain...
              </p>
            ) : activePositions.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-400">
                No active blockchain staking
                positions were found.
              </p>
            ) : (
              <div className="divide-y divide-neutral-800 text-xs">
                {activePositions.map(
                  (position) => (
                    <div
                      key={position.id}
                      className="flex flex-col items-start justify-between gap-4 py-4 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {position.amount} MUSIC
                          </span>

                          <span className="rounded border border-purple-500/30 bg-purple-950/80 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                            {position.durationDays} Days
                            ({position.apy}% APY)
                          </span>
                        </div>

                        <p className="text-[11px] text-neutral-400">
                          {position.canUnstake
                            ? "Lock period completed"
                            : `Lock expires in ${position.daysLeft} days`}
                        </p>
                      </div>

                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                        <div className="text-right">
                          <span className="block text-[11px] text-neutral-400">
                            Blockchain Reward
                          </span>

                          <span className="text-xs font-bold text-emerald-400">
                            +{position.earnedReward} MUSIC
                          </span>
                        </div>

                        {position.canUnstake ? (
                          <button
                            type="button"
                            onClick={() =>
                              void handleUnstake(
                                position.id
                              )
                            }
                            disabled={
                              pendingAction !== ""
                            }
                            className="rounded-xl border border-purple-500/40 bg-purple-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-900 disabled:opacity-50"
                          >
                            {pendingAction ===
                            `unstake-${position.id}`
                              ? "Processing..."
                              : "Unstake"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void handleClaim(
                                position.id
                              )
                            }
                            disabled={
                              pendingAction !== ""
                            }
                            className="rounded-xl border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
                          >
                            {pendingAction ===
                            `claim-${position.id}`
                              ? "Processing..."
                              : "Claim Reward"}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              Staking Rules & Security
            </h3>

            <ul className="space-y-1.5 text-xs leading-relaxed text-neutral-400">
              <li>
                • Positions are read directly
                from FanToken.sol.
              </li>

              <li>
                • Principal can be withdrawn
                only after the lock period.
              </li>

              <li>
                • MetaMask confirmation is
                required for every transaction.
              </li>

              <li>
                • Polygon Amoy test assets have
                no real monetary value.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 text-center">
      <p className="text-xs font-medium text-neutral-400">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-lg font-black sm:text-2xl ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-400">
        {label}:
      </span>

      <span className="text-right font-semibold text-white">
        {value}
      </span>
    </div>
  );
}