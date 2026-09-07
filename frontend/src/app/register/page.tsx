"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useState } from "react";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register/", form);
      router.push("/login");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const messages = Object.values(error.response.data).flat().join(" ");
        setError(messages);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-neutral-400">Join the MusicCoin platform</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="first_name"
              value={form.first_name}
              onChange={updateField}
              placeholder="First name"
              required
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
            />

            <input
              name="last_name"
              value={form.last_name}
              onChange={updateField}
              placeholder="Last name"
              required
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
            />
          </div>

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            placeholder="Email address"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
          />

          <input
            name="phone"
            value={form.phone}
            onChange={updateField}
            placeholder="Phone number"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
          />

          <select
            name="role"
            value={form.role}
            onChange={updateField}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
          >
            <option value="FAN">Fan</option>
            <option value="ARTIST">Artist</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="PRODUCTION_HOUSE">Production House</option>
          </select>

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
          />

          <input
            name="confirm_password"
            type="password"
            value={form.confirm_password}
            onChange={updateField}
            placeholder="Confirm password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3"
          />

          {error && (
            <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 font-semibold hover:bg-violet-500 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-400">
          Already registered?{" "}
          <Link href="/login" className="text-violet-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}