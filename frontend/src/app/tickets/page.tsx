"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  LoaderCircle,
  MapPin,
  QrCode,
  Ticket,
} from "lucide-react";

import api from "@/lib/api";

type TicketItem = {
  id: string;
  event_title: string;
  event_start_date: string;
  event_city: string;
  tier_name: string;
  nft_token_id: number | null;
  status: string;
  verification_hash: string;
  purchase_price: string;
  created_at: string;
  checked_in_at: string | null;
};

export default function MyTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function loadTickets() {
      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        sessionStorage.setItem("post_login_redirect", "/tickets");
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.get<TicketItem[]>(
          "/tickets/my-tickets/",
        );

        setTickets(response.data);
      } catch (requestError) {
        if (
          axios.isAxiosError(requestError) &&
          requestError.response?.status === 401
        ) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          sessionStorage.setItem("post_login_redirect", "/tickets");
          router.push("/login");
          return;
        }

        setError("Your tickets could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    loadTickets();
  }, [router]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  async function copyValue(value: string, name: string) {
    await navigator.clipboard.writeText(value);
    setCopied(name);

    window.setTimeout(() => {
      setCopied("");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(217,70,239,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
            Your experiences
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            My tickets
          </h1>

          <p className="mt-5 max-w-2xl text-lg text-neutral-400">
            View your MusicCoin event passes and secure gate
            verification details.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading && (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-center text-neutral-400">
              <LoaderCircle
                className="mx-auto mb-3 animate-spin text-violet-400"
                size={34}
              />
              Loading your tickets…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && tickets.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
            <Ticket
              className="mx-auto text-neutral-600"
              size={48}
            />

            <h2 className="mt-5 text-2xl font-bold">
              No tickets yet
            </h2>

            <p className="mt-2 text-neutral-500">
              Find an event and reserve your first MusicCoin ticket.
            </p>

            <Link
              href="/events"
              className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-semibold"
            >
              Explore events
            </Link>
          </div>
        )}

        {!loading && !error && tickets.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {tickets.map((ticketItem) => (
              <article
                key={ticketItem.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d10]"
              >
                <div className="border-b border-white/10 bg-gradient-to-r from-violet-950/60 to-fuchsia-950/30 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-400">
                        MusicCoin pass
                      </p>

                      <h2 className="mt-3 text-2xl font-bold">
                        {ticketItem.event_title}
                      </h2>
                    </div>

                    <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      {ticketItem.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-[1fr_130px]">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm text-neutral-400">
                      <CalendarDays
                        className="mt-0.5 shrink-0 text-violet-400"
                        size={18}
                      />
                      {formatDate(ticketItem.event_start_date)}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                      <MapPin
                        className="shrink-0 text-violet-400"
                        size={18}
                      />
                      {ticketItem.event_city}
                    </div>

                    <div className="flex items-center gap-3 text-sm text-neutral-400">
                      <Ticket
                        className="shrink-0 text-violet-400"
                        size={18}
                      />
                      {ticketItem.tier_name}
                    </div>

                    <div className="pt-2">
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        Purchase price
                      </p>
                      <p className="mt-1 text-xl font-bold">
                        ₹{ticketItem.purchase_price}
                      </p>
                    </div>
                  </div>

                  <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white p-4 text-black">
                    <QrCode size={65} />
                    <p className="mt-2 text-center text-[10px] font-bold uppercase">
                      Secure pass
                    </p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 bg-black/20 p-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Ticket ID
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <code className="min-w-0 flex-1 truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-neutral-300">
                        {ticketItem.id}
                      </code>

                      <button
                        type="button"
                        onClick={() =>
                          copyValue(ticketItem.id, ticketItem.id)
                        }
                        className="rounded-lg border border-white/10 p-2 text-neutral-400 hover:text-white"
                        title="Copy ticket ID"
                      >
                        {copied === ticketItem.id ? (
                          <CheckCircle2
                            className="text-emerald-400"
                            size={17}
                          />
                        ) : (
                          <Copy size={17} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-neutral-600">
                      Verification code
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <code className="min-w-0 flex-1 truncate rounded-lg bg-black/40 px-3 py-2 text-xs text-neutral-300">
                        {ticketItem.verification_hash}
                      </code>

                      <button
                        type="button"
                        onClick={() =>
                          copyValue(
                            ticketItem.verification_hash,
                            `${ticketItem.id}-hash`,
                          )
                        }
                        className="rounded-lg border border-white/10 p-2 text-neutral-400 hover:text-white"
                        title="Copy verification code"
                      >
                        {copied === `${ticketItem.id}-hash` ? (
                          <CheckCircle2
                            className="text-emerald-400"
                            size={17}
                          />
                        ) : (
                          <Copy size={17} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}