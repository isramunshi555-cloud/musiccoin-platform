"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import api from "@/lib/api";

type User = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  wallet_address: string | null;
  is_verified: boolean;
};

type WalletTransaction = {
  id: number;
  user_email: string;
  tx_hash: string;
  tx_type: string;
  amount: string;
  currency: string;
  status: string;
  from_address: string;
  to_address: string;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(
      null,
    );

  const [
    transactions,
    setTransactions,
  ] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [
    transactionsLoading,
    setTransactionsLoading,
  ] = useState(false);

  const [
    transactionError,
    setTransactionError,
  ] = useState("");

  const loadAdminTransactions =
    useCallback(
      async () => {
        try {
          setTransactionsLoading(
            true,
          );

          setTransactionError(
            "",
          );

          const response =
            await api.get<
              WalletTransaction[]
            >(
              "/wallet/admin/transactions/",
            );

          setTransactions(
            response.data,
          );
        } catch {
          setTransactionError(
            "Could not load admin transaction history.",
          );
        } finally {
          setTransactionsLoading(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response =
          await api.get<User>(
            "/users/me/",
          );

        const currentUser =
          response.data;

        setUser(
          currentUser,
        );

        if (
          currentUser.role ===
          "ADMIN"
        ) {
          await loadAdminTransactions();
        }
      } catch {
        localStorage.removeItem(
          "access_token",
        );

        localStorage.removeItem(
          "refresh_token",
        );

        router.replace(
          "/login",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadDashboard();
  }, [
    router,
    loadAdminTransactions,
  ]);

  async function handleLogout() {
    const refreshToken =
      localStorage.getItem(
        "refresh_token",
      );

    try {
      if (refreshToken) {
        await api.post(
          "/auth/logout/",
          {
            refresh:
              refreshToken,
          },
        );
      }
    } catch {
      // Clear the local session even
      // if server logout fails.
    } finally {
      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "refresh_token",
      );

      router.replace(
        "/login",
      );
    }
  }

  function shortenAddress(
    address: string,
  ) {
    if (!address) {
      return "—";
    }

    if (
      address.length <= 14
    ) {
      return address;
    }

    return `${address.slice(
      0,
      6,
    )}...${address.slice(
      -4,
    )}`;
  }

  function shortenHash(
    hash: string,
  ) {
    if (!hash) {
      return "—";
    }

    return `${hash.slice(
      0,
      8,
    )}...${hash.slice(
      -6,
    )}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <p className="text-neutral-400">
          Loading your
          dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-neutral-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              MusicCoin
            </h1>

            <p className="mt-1 text-neutral-400">
              {user?.role ===
              "ADMIN"
                ? "Admin dashboard"
                : "User dashboard"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="rounded-lg border border-neutral-700 px-4 py-2 transition hover:bg-neutral-800"
          >
            Log out
          </button>
        </header>

        {user && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-2xl font-semibold">
              Welcome,{" "}
              {user.first_name ||
                user.email}
            </h2>

            <div className="mt-6 grid gap-3 text-neutral-300 sm:grid-cols-2">
              <p>
                Email:{" "}
                <span className="text-white">
                  {user.email}
                </span>
              </p>

              <p>
                Role:{" "}
                <span className="text-white">
                  {user.role}
                </span>
              </p>

              <p>
                Phone:{" "}
                <span className="text-white">
                  {user.phone ||
                    "Not provided"}
                </span>
              </p>

              <p>
                Verification:{" "}
                <span className="text-white">
                  {user.is_verified
                    ? "Verified"
                    : "Not verified"}
                </span>
              </p>

              <p className="sm:col-span-2">
                Wallet:{" "}
                <span className="break-all text-white">
                  {user.wallet_address ||
                    "No wallet connected"}
                </span>
              </p>
            </div>
          </section>
        )}

        {user?.role ===
          "ADMIN" && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  Blockchain Transaction
                  Monitor
                </h2>

                <p className="mt-1 text-sm text-neutral-400">
                  Monitor blockchain
                  activity recorded by
                  MusicCoin users.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-300">
                  Records:{" "}
                  <span className="font-semibold text-white">
                    {
                      transactions.length
                    }
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadAdminTransactions()
                  }
                  disabled={
                    transactionsLoading
                  }
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={
                      transactionsLoading
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>
              </div>
            </div>

            {transactionsLoading &&
              transactions.length ===
                0 && (
                <p className="mt-6 text-neutral-400">
                  Loading
                  transactions...
                </p>
              )}

            {transactionError && (
              <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {
                  transactionError
                }
              </div>
            )}

            {!transactionsLoading &&
              !transactionError &&
              transactions.length ===
                0 && (
                <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-center text-neutral-400">
                  No blockchain
                  transactions have
                  been recorded yet.
                </div>
              )}

            {transactions.length >
              0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[1150px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400">
                      <th className="px-3 py-3">
                        User
                      </th>

                      <th className="px-3 py-3">
                        Type
                      </th>

                      <th className="px-3 py-3">
                        Amount
                      </th>

                      <th className="px-3 py-3">
                        From
                      </th>

                      <th className="px-3 py-3">
                        To
                      </th>

                      <th className="px-3 py-3">
                        Transaction
                      </th>

                      <th className="px-3 py-3">
                        Status
                      </th>

                      <th className="px-3 py-3">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map(
                      (
                        transaction,
                      ) => (
                        <tr
                          key={
                            transaction.id
                          }
                          className="border-b border-neutral-800/70"
                        >
                          <td className="px-3 py-4 text-neutral-300">
                            {
                              transaction.user_email
                            }
                          </td>

                          <td className="px-3 py-4">
                            <span className="rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">
                              {
                                transaction.tx_type
                              }
                            </span>
                          </td>

                          <td className="px-3 py-4 font-semibold text-white">
                            {
                              transaction.amount
                            }{" "}
                            {
                              transaction.currency
                            }
                          </td>

                          <td className="px-3 py-4 font-mono text-neutral-300">
                            {shortenAddress(
                              transaction.from_address,
                            )}
                          </td>

                          <td className="px-3 py-4 font-mono text-neutral-300">
                            {shortenAddress(
                              transaction.to_address,
                            )}
                          </td>

                          <td className="px-3 py-4">
                            {transaction.tx_hash ? (
                              <a
                                href={`https://amoy.polygonscan.com/tx/${transaction.tx_hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-mono text-purple-400 hover:text-purple-300"
                              >
                                {shortenHash(
                                  transaction.tx_hash,
                                )}

                                <ExternalLink
                                  size={
                                    13
                                  }
                                />
                              </a>
                            ) : (
                              <span className="text-neutral-500">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-3 py-4">
                            <span
                              className={
                                transaction.status ===
                                "CONFIRMED"
                                  ? "text-emerald-400"
                                  : transaction.status ===
                                      "FAILED"
                                    ? "text-red-400"
                                    : "text-amber-400"
                              }
                            >
                              {
                                transaction.status
                              }
                            </span>
                          </td>

                          <td className="px-3 py-4 text-neutral-400">
                            {new Date(
                              transaction.created_at,
                            ).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}