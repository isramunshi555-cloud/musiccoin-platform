"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    setUid(parameters.get("uid") ?? "");
    setToken(parameters.get("token") ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!uid || !token) {
      setError("This password-reset link is invalid.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password/", {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setMessage(response.data.detail);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        const messages = Object.values(error.response.data)
          .flat()
          .join(" ");

        setError(messages);
      } else {
        setError("Unable to reset your password.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h1 className="text-3xl font-bold">Reset password</h1>

        <p className="mt-2 text-sm text-neutral-400">
          Enter and confirm your new password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            required
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none focus:border-violet-500"
          />

          {message && (
            <p className="rounded-lg bg-green-500/10 p-3 text-sm text-green-400">
              {message}
            </p>
          )}

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
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 block text-center text-sm text-violet-400 hover:underline"
        >
          Return to login
        </Link>
      </div>
    </main>
  );
}