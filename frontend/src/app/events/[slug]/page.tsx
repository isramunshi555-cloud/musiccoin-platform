"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Music,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";

import api from "@/lib/api";

type Venue = {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
};

type TicketTier = {
  id: number;
  tier_name: string;
  description: string;
  price_fiat: string;
  price_crypto: string;
  max_supply: number;
  minted_count: number;
  max_resale_price: string;
  is_active: boolean;
};

type ArtistSchedule = {
  id: number;
  artist: number;
  artist_name: string;
  artist_image: string;
  stage_name: string;
  start_time: string;
  end_time: string;
};

type EventDetail = {
  id: number;
  title: string;
  slug: string;
  description: string;
  banner_image_url: string;
  venue: Venue | null;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  status: string;
  is_featured: boolean;
  organizer_email: string;
  tiers: TicketTier[];
  lineup: ArtistSchedule[];
  created_at: string;
};

type PurchasedTicket = {
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

export default function EventDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [selectedTier, setSelectedTier] = useState<number | null>(
    null,
  );
  const [purchasedTicket, setPurchasedTicket] =
    useState<PurchasedTicket | null>(null);

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<EventDetail>(
          `/events/${params.slug}/`,
        );

        setEvent(response.data);

        const firstAvailableTier = response.data.tiers.find(
          (tier) =>
            tier.is_active && tier.minted_count < tier.max_supply,
        );

        if (firstAvailableTier) {
          setSelectedTier(firstAvailableTier.id);
        }
      } catch {
        setError("This event could not be loaded.");
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      loadEvent();
    }
  }, [params.slug]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  function redirectToLogin() {
    sessionStorage.setItem(
      "post_login_redirect",
      `/events/${params.slug}`,
    );

    router.push("/login");
  }

  async function purchaseTicket() {
    if (!selectedTier) {
      setPurchaseError("Please select an available ticket tier.");
      return;
    }

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      redirectToLogin();
      return;
    }

    try {
      setPurchasing(true);
      setPurchaseError("");

      const response = await api.post<PurchasedTicket>(
        "/tickets/purchase/",
        {
          tier_id: selectedTier,
          payment_method: "FIAT",
        },
      );

      setPurchasedTicket(response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          redirectToLogin();
          return;
        }

        setPurchaseError(
          requestError.response?.data?.detail ??
            "The ticket could not be reserved.",
        );
      } else {
        setPurchaseError("The ticket could not be reserved.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#060608] text-white">
        <div className="text-center text-neutral-400">
          <LoaderCircle
            className="mx-auto mb-3 animate-spin text-violet-400"
            size={36}
          />
          Loading event…
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-[70vh] bg-[#060608] px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-2xl font-bold">Event unavailable</h1>

          <p className="mt-3 text-red-200">
            {error || "This event does not exist."}
          </p>

          <Link
            href="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black"
          >
            <ArrowLeft size={18} />
            Back to events
          </Link>
        </div>
      </main>
    );
  }

  const activeTiers = event.tiers.filter((tier) => tier.is_active);
  const selectedTierData = activeTiers.find(
    (tier) => tier.id === selectedTier,
  );

  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/events"
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-neutral-400 hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to events
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111114]">
          <div
            className="relative min-h-96 bg-cover bg-center"
            style={
              event.banner_image_url
                ? {
                    backgroundImage: `url("${event.banner_image_url}")`,
                  }
                : undefined
            }
          >
            {!event.banner_image_url && (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(168,85,247,0.7),transparent_28%),radial-gradient(circle_at_75%_55%,rgba(217,70,239,0.25),transparent_30%),linear-gradient(135deg,#111827,#3b0764,#07070a)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-black/45 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-10">
              {event.is_featured && (
                <span className="mb-4 inline-flex rounded-full border border-violet-300/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-100">
                  Featured experience
                </span>
              )}

              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {event.title}
              </h1>

              <div className="mt-6 flex flex-wrap gap-5 text-sm text-neutral-200">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    className="text-violet-300"
                    size={18}
                  />
                  {formatDate(event.start_date)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <MapPin className="text-violet-300" size={18} />
                  {event.city}, {event.country}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-8">
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-400">
                About the event
              </p>

              <p className="mt-5 whitespace-pre-line text-lg leading-8 text-neutral-300">
                {event.description}
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <MapPin className="text-violet-400" size={24} />
                <h2 className="mt-4 text-lg font-bold">Venue</h2>
                <p className="mt-2 text-neutral-400">
                  {event.venue?.name || "Venue to be announced"}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {event.venue?.address}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <Users className="text-violet-400" size={24} />
                <h2 className="mt-4 text-lg font-bold">Capacity</h2>
                <p className="mt-2 text-neutral-400">
                  {event.venue
                    ? `${event.venue.capacity.toLocaleString("en-IN")} attendees`
                    : "To be announced"}
                </p>
              </div>
            </section>

            {event.lineup.length > 0 && (
              <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-7">
                <div className="flex items-center gap-3">
                  <Music className="text-violet-400" size={24} />
                  <h2 className="text-2xl font-bold">
                    Artist lineup
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  {event.lineup.map((artist) => (
                    <div
                      key={artist.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <p className="font-semibold">
                          {artist.artist_name}
                        </p>
                        <p className="mt-1 text-sm text-violet-400">
                          {artist.stage_name}
                        </p>
                      </div>

                      <p className="text-sm text-neutral-400">
                        {formatDate(artist.start_time)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-7">
              <div className="flex gap-4">
                <ShieldCheck
                  className="shrink-0 text-emerald-400"
                  size={28}
                />

                <div>
                  <h2 className="font-bold">Secure ticketing</h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-400">
                    Every ticket receives secure verification for
                    controlled entry and duplicate-use protection.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-white/10 bg-[#0d0d10] p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <Ticket className="text-violet-400" size={25} />
              <h2 className="text-2xl font-bold">
                Choose your ticket
              </h2>
            </div>

            {purchasedTicket ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
                <CheckCircle2
                  className="text-emerald-400"
                  size={38}
                />

                <h3 className="mt-4 text-xl font-bold">
                  Ticket reserved!
                </h3>

                <p className="mt-2 text-sm text-neutral-300">
                  Your {purchasedTicket.tier_name} ticket has been
                  created successfully.
                </p>

                <div className="mt-5 rounded-xl bg-black/30 p-4 text-sm">
                  <p className="text-neutral-500">Ticket ID</p>
                  <p className="mt-1 break-all font-mono text-white">
                    {purchasedTicket.id}
                  </p>
                </div>

                <Link
                  href="/tickets"
                  className="mt-5 inline-flex w-full justify-center rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black"
                >
                  View my tickets
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-3">
                  {activeTiers.length === 0 && (
                    <div className="rounded-xl border border-white/10 p-5 text-neutral-400">
                      Tickets are not available yet.
                    </div>
                  )}

                  {activeTiers.map((tier) => {
                    const soldOut =
                      tier.minted_count >= tier.max_supply;

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          selectedTier === tier.id
                            ? "border-violet-500 bg-violet-500/10"
                            : "border-white/10 bg-white/[0.025]"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {tier.tier_name}
                            </p>
                            <p className="mt-2 text-sm text-neutral-500">
                              {tier.description ||
                                "Admission to this event"}
                            </p>
                          </div>

                          <p className="shrink-0 text-lg font-bold">
                            ₹{tier.price_fiat}
                          </p>
                        </div>

                        <p className="mt-3 text-xs text-neutral-500">
                          {soldOut
                            ? "Sold out"
                            : `${tier.max_supply - tier.minted_count} remaining`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {purchaseError && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                    {purchaseError}
                  </div>
                )}

                <button
                  type="button"
                  disabled={!selectedTierData || purchasing}
                  onClick={purchaseTicket}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {purchasing ? (
                    <>
                      <LoaderCircle
                        className="animate-spin"
                        size={19}
                      />
                      Reserving…
                    </>
                  ) : (
                    <>
                      <Ticket size={19} />
                      Reserve ticket
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-xs leading-5 text-neutral-600">
                  This MVP currently records a fiat ticket
                  reservation. Payment integration will be added
                  separately.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}