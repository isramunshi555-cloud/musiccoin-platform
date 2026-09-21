"use client";

import axios from "axios";
import type { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Camera,
  CameraOff,
  CheckCircle2,
  LoaderCircle,
  QrCode,
  ScanLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";

type ScanResult = {
  detail: string;
  valid: boolean;
  attendee_email?: string;
  event_title?: string;
  tier_name?: string;
  nft_token_id?: number | null;
  checked_in_at?: string;
  already_used?: boolean;
};

type TicketQrPayload = {
  ticket_id: string;
  verification_hash: string;
};

export default function ScannerPage() {
  const router = useRouter();
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const [ticketId, setTicketId] = useState("");
  const [verificationHash, setVerificationHash] =
    useState("");
  const [result, setResult] = useState<ScanResult | null>(
    null,
  );
  const [error, setError] = useState("");
  const [scanMessage, setScanMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraStarting, setCameraStarting] =
    useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    return () => {
      const scanner = qrScannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {
            // The camera may already be stopped.
          })
          .finally(() => {
            try {
              scanner.clear();
            } catch {
              // The scanner element may already be removed.
            }
          });
      }
    };
  }, []);

  function parseQrPayload(decodedText: string) {
    const parsedData = JSON.parse(
      decodedText,
    ) as Partial<TicketQrPayload>;

    if (
      typeof parsedData.ticket_id !== "string" ||
      typeof parsedData.verification_hash !== "string" ||
      !parsedData.ticket_id.trim() ||
      !parsedData.verification_hash.trim()
    ) {
      throw new Error("Invalid MusicCoin ticket QR code.");
    }

    return {
      ticket_id: parsedData.ticket_id.trim(),
      verification_hash:
        parsedData.verification_hash.trim(),
    };
  }

  async function stopCamera() {
    const scanner = qrScannerRef.current;

    if (scanner) {
      try {
        await scanner.stop();
      } catch {
        // The scanner might already be stopped.
      }

      try {
        scanner.clear();
      } catch {
        // The scanner container might already be clear.
      }

      qrScannerRef.current = null;
    }

    setCameraActive(false);
    setCameraStarting(false);
  }

  async function handleQrDecoded(decodedText: string) {
    try {
      const qrPayload = parseQrPayload(decodedText);

      setTicketId(qrPayload.ticket_id);
      setVerificationHash(qrPayload.verification_hash);
      setResult(null);
      setError("");
      setScanMessage(
        "Ticket QR captured. Select “Verify and check in” to validate admission.",
      );

      await stopCamera();
    } catch {
      setError(
        "This QR code is not a valid MusicCoin ticket.",
      );
    }
  }

  async function startCamera() {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      sessionStorage.setItem(
        "post_login_redirect",
        "/scanner",
      );
      router.push("/login");
      return;
    }

    try {
      setCameraStarting(true);
      setCameraActive(true);
      setError("");
      setScanMessage("");
      setResult(null);

      await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => resolve());
      });

      const qrCodeModule = await import("html5-qrcode");
      const scanner = new qrCodeModule.Html5Qrcode(
        "musiccoin-qr-reader",
      );

      qrScannerRef.current = scanner;

      await scanner.start(
        {
          facingMode: "environment",
        },
        {
          fps: 10,
          qrbox: {
            width: 240,
            height: 240,
          },
          aspectRatio: 1,
        },
        (decodedText) => {
          void handleQrDecoded(decodedText);
        },
        () => {
          // Scanning continues until a valid QR is detected.
        },
      );

      setCameraStarting(false);
    } catch {
      await stopCamera();

      setError(
        "The camera could not be opened. Allow camera permission or enter the ticket details manually.",
      );
    }
  }

  async function handleCheckIn(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      sessionStorage.setItem(
        "post_login_redirect",
        "/scanner",
      );
      router.push("/login");
      return;
    }

    if (!ticketId.trim() || !verificationHash.trim()) {
      setError(
        "Scan a ticket QR code or enter both ticket details.",
      );
      return;
    }

    try {
      setScanning(true);
      setError("");
      setScanMessage("");
      setResult(null);

      const response = await api.post<ScanResult>(
        "/tickets/check-in/",
        {
          ticket_id: ticketId.trim(),
          verification_hash: verificationHash.trim(),
        },
      );

      setResult(response.data);
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        if (requestError.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          sessionStorage.setItem(
            "post_login_redirect",
            "/scanner",
          );

          router.push("/login");
          return;
        }

        const responseData = requestError.response?.data;

        if (
          responseData &&
          typeof responseData === "object" &&
          "detail" in responseData
        ) {
          setResult({
            detail: String(responseData.detail),
            valid: false,
            already_used: Boolean(
              responseData.already_used,
            ),
            checked_in_at: responseData.checked_in_at,
          });
        } else if (
          responseData &&
          typeof responseData === "object"
        ) {
          setError(
            Object.values(responseData).flat().join(" "),
          );
        } else {
          setError("The ticket could not be verified.");
        }
      } else {
        setError("The ticket could not be verified.");
      }
    } finally {
      setScanning(false);
    }
  }

  async function resetScanner() {
    await stopCamera();

    setTicketId("");
    setVerificationHash("");
    setResult(null);
    setError("");
    setScanMessage("");
  }

  return (
    <main className="min-h-screen bg-[#060608] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12),transparent_30%)]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-20">
          <div className="flex items-center gap-3 text-violet-400">
            <ScanLine size={25} />

            <p className="text-sm font-semibold uppercase tracking-[0.3em]">
              Event operations
            </p>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            Secure gate scanner
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-400">
            Scan MusicCoin ticket QR codes, prevent duplicate
            entry and record admissions securely.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-white/10 bg-[#0d0d10] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/10 p-3 text-violet-400">
              <QrCode size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Verify attendee
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Scan the attendee&apos;s QR code or enter the
                ticket details manually.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div
              id="musiccoin-qr-reader"
              className={
                cameraActive
                  ? "overflow-hidden rounded-xl bg-white"
                  : "hidden"
              }
            />

            {!cameraActive && (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Camera
                  className="text-violet-400"
                  size={42}
                />

                <p className="mt-4 font-semibold">
                  Scan a MusicCoin ticket
                </p>

                <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
                  Open your camera and point it at the QR code
                  displayed on the attendee&apos;s ticket.
                </p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              {!cameraActive ? (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  disabled={cameraStarting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cameraStarting ? (
                    <>
                      <LoaderCircle
                        className="animate-spin"
                        size={19}
                      />
                      Opening camera...
                    </>
                  ) : (
                    <>
                      <Camera size={19} />
                      Open camera
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void stopCamera()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold transition hover:bg-white/5"
                >
                  <CameraOff size={19} />
                  Stop camera
                </button>
              )}
            </div>
          </div>

          {scanMessage && (
            <div className="mt-5 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <CheckCircle2
                className="shrink-0"
                size={20}
              />
              <p>{scanMessage}</p>
            </div>
          )}

          <form
            onSubmit={handleCheckIn}
            className="mt-8 space-y-6"
          >
            <div>
              <label
                htmlFor="ticketId"
                className="mb-2 block text-sm font-medium text-neutral-300"
              >
                Ticket ID
              </label>

              <input
                id="ticketId"
                type="text"
                value={ticketId}
                onChange={(event) =>
                  setTicketId(event.target.value)
                }
                required
                placeholder="Scan the QR or paste the ticket UUID"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 font-mono text-sm text-white outline-none placeholder:text-neutral-700 focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="verificationHash"
                className="mb-2 block text-sm font-medium text-neutral-300"
              >
                Verification code
              </label>

              <textarea
                id="verificationHash"
                value={verificationHash}
                onChange={(event) =>
                  setVerificationHash(event.target.value)
                }
                required
                rows={4}
                placeholder="Scan the QR or paste the verification code"
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 font-mono text-sm text-white outline-none placeholder:text-neutral-700 focus:border-violet-500"
              />
            </div>

            {error && (
              <div className="flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                <AlertTriangle
                  className="shrink-0"
                  size={20}
                />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-4 font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <LoaderCircle
                    className="animate-spin"
                    size={20}
                  />
                  Verifying...
                </>
              ) : (
                <>
                  <ScanLine size={20} />
                  Verify and check in
                </>
              )}
            </button>
          </form>
        </div>

        <aside className="space-y-6">
          {result ? (
            <div
              className={`rounded-3xl border p-7 ${
                result.valid
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              {result.valid ? (
                <CheckCircle2
                  className="text-emerald-400"
                  size={48}
                />
              ) : (
                <XCircle
                  className="text-red-400"
                  size={48}
                />
              )}

              <h2 className="mt-5 text-2xl font-bold">
                {result.valid
                  ? "Admission granted"
                  : "Admission denied"}
              </h2>

              <p
                className={`mt-3 leading-7 ${
                  result.valid
                    ? "text-emerald-100"
                    : "text-red-100"
                }`}
              >
                {result.detail}
              </p>

              {result.valid && (
                <div className="mt-6 space-y-4 rounded-2xl bg-black/25 p-5 text-sm">
                  <ResultRow
                    label="Attendee"
                    value={result.attendee_email}
                  />

                  <ResultRow
                    label="Event"
                    value={result.event_title}
                  />

                  <ResultRow
                    label="Ticket tier"
                    value={result.tier_name}
                  />

                  <ResultRow
                    label="Checked in"
                    value={
                      result.checked_in_at
                        ? new Date(
                            result.checked_in_at,
                          ).toLocaleString("en-IN")
                        : undefined
                    }
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => void resetScanner()}
                className="mt-6 w-full rounded-xl border border-white/15 px-5 py-3 font-semibold transition hover:bg-white/5"
              >
                Scan another ticket
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">
              <ShieldCheck
                className="text-emerald-400"
                size={40}
              />

              <h2 className="mt-5 text-xl font-bold">
                Verification checks
              </h2>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-neutral-400">
                <li>• Ticket verification-code integrity</li>
                <li>• Organizer authorization</li>
                <li>• Event entry time window</li>
                <li>• Cancelled ticket detection</li>
                <li>• Duplicate check-in prevention</li>
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm leading-6 text-amber-100">
            Only the event organizer or an administrator can
            check attendees in.
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5 text-sm leading-6 text-blue-100">
            Camera scanning works on localhost or over HTTPS.
            Manual verification remains available when camera
            access is unavailable.
          </div>
        </aside>
      </section>
    </main>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </p>

      <p className="mt-1 break-words text-white">
        {value}
      </p>
    </div>
  );
}