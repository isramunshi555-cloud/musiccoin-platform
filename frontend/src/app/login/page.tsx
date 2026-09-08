"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        email,
        password,
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);

      const redirectTo =
        sessionStorage.getItem("post_login_redirect") || "/dashboard";

      sessionStorage.removeItem("post_login_redirect");
      router.push(redirectTo);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        setError(
          requestError.response?.data?.detail ??
            "Unable to log in. Please check your credentials.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070a] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/musiccoin-login-bg.png')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#07070a]/65 via-[#07070a]/85 to-[#07070a]/95" />
      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between p-14 lg:flex">
          <Link href="/" className="flex w-fit items-center gap-3">
            <Image
              src="/musiccoin-logo.png"
              alt="MusicCoin logo"
              width={52}
              height={52}
              priority
              className="h-13 w-13 object-contain"
            />

            <span className="text-xl font-semibold tracking-wide">
              MusicCoin
            </span>
          </Link>

          <div className="max-w-xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              The future of live music
            </p>

            <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight xl:text-6xl">
              Music, ownership
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                and unforgettable moments.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-neutral-300">
              Discover artists, attend exclusive events and collect
              digital experiences built for true music fans.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                "Exclusive events",
                "Digital tickets",
                "Artist community",
              ].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-neutral-300 backdrop-blur-md"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <p className="text-sm text-neutral-500">
            © 2026 MusicCoin. Built for the music community.
          </p>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 flex w-fit items-center gap-3 lg:hidden"
            >
              <Image
                src="/musiccoin-logo.png"
                alt="MusicCoin logo"
                width={48}
                height={48}
                priority
                className="h-12 w-12 object-contain"
              />

              <span className="text-xl font-semibold">MusicCoin</span>
            </Link>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
              <p className="text-sm font-medium text-violet-400">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Log in to MusicCoin
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Enter your details to continue your musical journey.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-neutral-300"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-neutral-300"
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 pr-16 text-white outline-none transition placeholder:text-neutral-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-neutral-400 hover:text-white"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 font-semibold shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Log in"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-neutral-600">
                  New here?
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Link
                href="/register"
                className="block w-full rounded-xl border border-white/10 px-4 py-3.5 text-center font-medium text-neutral-200 transition hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                Create a MusicCoin account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}