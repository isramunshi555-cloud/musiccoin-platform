"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  LogOut,
  QrCode,
  TicketCheck,
  UserCheck,
  Wallet,
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

export default function OrganizerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrganizer() {
      try {
        const response =
          await api.get<User>("/users/me/");

        const currentUser = response.data;

        if (currentUser.role !== "ORGANIZER") {
          router.replace("/login");
          return;
        }

        setUser(currentUser);
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    void loadOrganizer();
  }, [router]);

  async function handleLogout() {
    const refreshToken =
      localStorage.getItem("refresh_token");

    try {
      if (refreshToken) {
        await api.post("/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } catch {
      // Clear local session even if API logout fails.
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      router.replace("/login");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07070a] text-white">
        <p className="text-neutral-400">
          Loading Organizer Portal...
        </p>
      </main>
    );
  }

  const features = [
    {
      title: "Events",
      description:
        "View MusicCoin events and manage your festival operations.",
      href: "/events",
      icon: CalendarDays,
    },
    {
      title: "Gate Scanner",
      description:
        "Scan attendee ticket QR codes and validate admission at the venue.",
      href: "/scanner",
      icon: QrCode,
    },
    {
      title: "Ticket Operations",
      description:
        "Monitor ticket admission and event ticket activity.",
      href: "/scanner",
      icon: TicketCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-[#07070a] text-white">
      <header className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
              MusicCoin
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Organizer Portal
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-neutral-900 to-neutral-950 p-8">
          <div className="flex items-center gap-3">
            <UserCheck className="text-amber-400" />

            <p className="text-sm font-medium text-amber-400">
              ORGANIZER DASHBOARD
            </p>
          </div>

          <h2 className="mt-4 text-4xl font-bold">
            Welcome,{" "}
            {user?.first_name || user?.email}
          </h2>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Manage MusicCoin event operations, verify
            attendee tickets and control gate admission
            from your organizer portal.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm">
              Role: ORGANIZER
            </span>

            <span className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm">
              {user?.is_verified
                ? "Verified Organizer"
                : "Organizer Not Verified"}
            </span>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Organizer Features
          </h2>

          <p className="mt-2 text-neutral-400">
            Event and admission tools available to
            organizers.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group rounded-2xl border border-white/10 bg-neutral-900/70 p-6 transition hover:-translate-y-1 hover:border-amber-500/40 hover:bg-neutral-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-xl font-semibold group-hover:text-amber-300">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
            <div className="flex items-center gap-3">
              <Wallet className="text-amber-400" />

              <h2 className="text-xl font-semibold">
                Organizer Wallet
              </h2>
            </div>

            <p className="mt-4 text-sm text-neutral-400">
              Linked blockchain wallet
            </p>

            <p className="mt-2 break-all font-mono text-sm">
              {user?.wallet_address ||
                "No wallet address linked to profile"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 p-6">
            <h2 className="text-xl font-semibold">
              Organizer Account
            </h2>

            <p className="mt-4 text-sm text-neutral-400">
              Email
            </p>

            <p className="mt-1">
              {user?.email}
            </p>

            <p className="mt-4 text-sm text-neutral-400">
              Account Type
            </p>

            <p className="mt-1 font-semibold text-amber-400">
              ORGANIZER
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}