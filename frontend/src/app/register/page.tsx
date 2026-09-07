"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

const initialForm = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  role: "FAN",
  password: "",
  confirm_password: "",
};

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register/", form);
      router.push("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const messages = Object.values(error.response.data)
          .flat()
          .map(String)
          .join(" ");

        setError(messages);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07070a] text-white">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage: "url('/musiccoin-login-bg.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070a]/65 via-[#07070a]/85 to-[#07070a]/95" />

      {/* Decorative lighting */}
      <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-700/15 blur-[120px]" />
      <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-violet-700/20 blur-[120px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left section */}
        <section className="hidden flex-col justify-between p-14 lg:flex">
          <Link href="/" className="flex w-fit items-center gap-3">
            <Image
              src="/musiccoin-logo.png"
              alt="MusicCoin logo"
              width={52}
              height={52}
              priority
              className="h-12 w-12 object-contain"
            />

            <span className="text-xl font-semibold tracking-wide">
              MusicCoin
            </span>
          </Link>

          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
              Join the movement
            </p>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">
              Your place in the
              <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300 bg-clip-text text-transparent">
                music economy.
              </span>
            </h1>

            <p className="mt-6 max-w-md leading-7 text-neutral-300">
              Connect with artists, discover live events and own unforgettable
              digital experiences.
            </p>

            <div className="mt-10 space-y-4 text-sm text-neutral-300">
              <p>✦ Discover emerging and established artists</p>
              <p>✦ Access exclusive events and experiences</p>
              <p>✦ Collect secure digital tickets</p>
            </div>
          </div>

          <p className="text-sm text-neutral-500">
            © 2026 MusicCoin. Built for the music community.
          </p>
        </section>

        {/* Registration section */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-2xl">
            {/* Mobile logo */}
            <Link
              href="/"
              className="mb-8 flex w-fit items-center gap-3 lg:hidden"
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
                Get started
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Create your account
              </h2>

              <p className="mt-3 text-sm text-neutral-400">
                Choose your role and become part of MusicCoin.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="First name"
                    name="first_name"
                    value={form.first_name}
                    onChange={updateField}
                    placeholder="First name"
                  />

                  <Field
                    label="Last name"
                    name="last_name"
                    value={form.last_name}
                    onChange={updateField}
                    placeholder="Last name"
                  />
                </div>

                <Field
                  label="Email address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="name@example.com"
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Phone number"
                    name="phone"
                    value={form.phone}
                    onChange={updateField}
                    placeholder="Your phone number"
                    required={false}
                  />

                  <div>
                    <label
                      htmlFor="role"
                      className="mb-2 block text-sm font-medium text-neutral-300"
                    >
                      Join as
                    </label>

                    <select
                      id="role"
                      name="role"
                      value={form.role}
                      onChange={updateField}
                      className="w-full rounded-xl border border-white/10 bg-[#111116] px-4 py-3.5 text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    >
                      <option value="FAN">Fan</option>
                      <option value="ARTIST">Artist</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="PRODUCTION_HOUSE">
                        Production House
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={updateField}
                    placeholder="Create password"
                  />

                  <Field
                    label="Confirm password"
                    name="confirm_password"
                    type={showPassword ? "text" : "password"}
                    value={form.confirm_password}
                    onChange={updateField}
                    placeholder="Repeat password"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-neutral-400">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword((current) => !current)}
                    className="h-4 w-4 accent-violet-600"
                  />
                  Show passwords
                </label>

                {error && (
                  <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3.5 font-semibold shadow-lg shadow-violet-950/40 transition hover:-translate-y-0.5 hover:shadow-violet-800/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-wider text-neutral-600">
                  Already registered?
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Link
                href="/login"
                className="block w-full rounded-xl border border-white/10 px-4 py-3.5 text-center font-medium text-neutral-200 transition hover:border-violet-500/40 hover:bg-violet-500/10"
              >
                Log in to MusicCoin
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
};

function Field({
  label,
  name,
  value,
  placeholder,
  type = "text",
  required = true,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-neutral-300"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-white outline-none transition placeholder:text-neutral-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
      />
    </div>
  );

}