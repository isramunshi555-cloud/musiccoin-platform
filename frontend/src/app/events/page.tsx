"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  LoaderCircle,
  MapPin,
  Search,
  Ticket,
} from "lucide-react";

import api from "@/lib/api";

type EventItem = {
  id: number;
  title: string;
  slug: string;
  banner_image_url: string;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  status: string;
  organizer_email: string;
  is_featured: boolean;
  min_price_fiat: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get<EventItem[]>("/events/");
        setEvents(response.data);
      } catch {
        setError(
          "We could not load live events. Please confirm that the Django backend is running.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const cities = useMemo(() => {
    return [
      "ALL",
      ...Array.from(new Set(events.map((event) => event.city))),
    ];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesCity =
        selectedCity === "ALL" || event.city === selectedCity;

      const matchesSearch =
        !query ||
        event.title.toLowerCase().includes(query) ||
        event.city.toLowerCase().includes(query) ||
        event.country.toLowerCase().includes(query);

      return matchesCity && matchesSearch;
    });
  }, [events, search, selectedCity]);

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(217,70,239,0.14),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-24">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-violet-400">
            Live experiences
          </p>

          <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">
            Find your next
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
              {" "}
              unforgettable show.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            Discover live artists, secure digital tickets and join the
            MusicCoin community.
          </p>

          <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl md:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                size={20}
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by event, city or country"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 outline-none transition placeholder:text-neutral-600 focus:border-violet-500"
              />
            </label>

            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#111114] px-5 py-3 outline-none focus:border-violet-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "ALL" ? "All cities" : city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-400">
              MUSICCOIN EVENTS
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Upcoming experiences
            </h2>
          </div>

          {!loading && !error && (
            <p className="text-sm text-neutral-500">
              {filteredEvents.length} event
              {filteredEvents.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {loading && (
          <div className="flex min-h-72 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="text-center text-neutral-400">
              <LoaderCircle
                className="mx-auto mb-3 animate-spin text-violet-400"
                size={32}
              />
              Loading live events…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && filteredEvents.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-20 text-center">
            <CalendarDays
              className="mx-auto mb-4 text-neutral-600"
              size={42}
            />

            <h3 className="text-xl font-semibold">
              No events found
            </h3>

            <p className="mt-2 text-neutral-500">
              Try another search or city.
            </p>
          </div>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d10] transition duration-300 hover:-translate-y-1 hover:border-violet-500/40"
              >
                <div
                  className="relative h-52 bg-cover bg-center"
                  style={
                    event.banner_image_url
                      ? {
                          backgroundImage: `linear-gradient(to top, rgba(6,6,8,0.95), rgba(6,6,8,0.12)), url("${event.banner_image_url}")`,
                        }
                      : undefined
                  }
                >
                  {!event.banner_image_url && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,85,247,0.55),transparent_30%),linear-gradient(135deg,#111827,#3b0764,#09090b)]" />
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {event.is_featured && (
                      <span className="mb-3 inline-flex rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200 backdrop-blur">
                        Featured
                      </span>
                    )}

                    <h3 className="text-2xl font-bold">
                      {event.title}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start gap-3 text-sm text-neutral-400">
                    <CalendarDays
                      className="mt-0.5 shrink-0 text-violet-400"
                      size={18}
                    />
                    <span>{formatDate(event.start_date)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-neutral-400">
                    <MapPin
                      className="shrink-0 text-violet-400"
                      size={18}
                    />
                    <span>
                      {event.city}, {event.country}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-600">
                        From
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        ₹{event.min_price_fiat}
                      </p>
                    </div>

                    <Link
                      href={`/events/${event.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-semibold transition hover:brightness-110"
                    >
                      <Ticket size={17} />
                      View event
                    </Link>
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