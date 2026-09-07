"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await api.get("/users/me/");
        setUser(response.data);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    const refreshToken = localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await api.post("/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-5">
          <div>
            <h1 className="text-3xl font-bold">MusicCoin</h1>
            <p className="mt-1 text-neutral-400">User dashboard</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
          >
            Log out
          </button>
        </header>

        {user && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <h2 className="text-2xl font-semibold">
              Welcome, {user.first_name || user.email}
            </h2>

            <div className="mt-6 space-y-3 text-neutral-300">
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
              <p>Phone: {user.phone || "Not provided"}</p>
              <p>
                Verification: {user.is_verified ? "Verified" : "Not verified"}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}