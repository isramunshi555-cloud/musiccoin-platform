"use client";

import { useState } from "react";
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Camera, 
  Clock 
} from "lucide-react";

interface ScanResult {
  valid: boolean;
  reason: string;
  details: string;
  ticketId: string;
  tier?: string;
  token?: number;
}

interface LogEntry {
  id: string;
  status: "VALID" | "ALREADY_USED" | "INVALID";
  time: string;
  tier: string;
}

interface StoredTicket {
  id: string;
  eventTitle?: string;
  tierName: string;
  nftTokenId?: number;
  status: string;
}

export default function GateScannerPage() {
  const [ticketInput, setTicketInput] = useState("mc-pass-849102");
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([
    { id: "mc-pass-193048", status: "VALID", time: "10:14 AM", tier: "General Admission" },
    { id: "mc-pass-771829", status: "ALREADY_USED", time: "10:11 AM", tier: "VIP Pass" },
  ]);

  const handleScan = () => {
    if (!ticketInput) return;
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);

      // Check against localStorage tickets
      const storedTickets: StoredTicket[] = JSON.parse(localStorage.getItem("mc_user_tickets") || "[]");
      const matched = storedTickets.find((t) => t.id === ticketInput);

      if (matched) {
        if (matched.status === "CHECKED_IN") {
          const res: ScanResult = {
            valid: false,
            reason: "TICKET ALREADY USED",
            details: "This pass was already scanned and checked in earlier today.",
            ticketId: ticketInput,
            tier: matched.tierName,
          };
          setScanResult(res);
          setRecentLogs((prev) => [{ id: ticketInput, status: "ALREADY_USED", time: new Date().toLocaleTimeString(), tier: matched.tierName }, ...prev]);
        } else {
          // Mark ticket as checked in
          matched.status = "CHECKED_IN";
          localStorage.setItem("mc_user_tickets", JSON.stringify(storedTickets));

          const res: ScanResult = {
            valid: true,
            reason: "ACCESS GRANTED",
            details: `Welcome to ${matched.eventTitle || "Cyberbeats"}! Attendee verified.`,
            ticketId: ticketInput,
            tier: matched.tierName,
            token: matched.nftTokenId,
          };
          setScanResult(res);
          setRecentLogs((prev) => [{ id: ticketInput, status: "VALID", time: new Date().toLocaleTimeString(), tier: matched.tierName }, ...prev]);
        }
      } else {
        // Sample fallback validation
        if (ticketInput.includes("849102")) {
          const res: ScanResult = {
            valid: true,
            reason: "ACCESS GRANTED",
            details: "Valid Polygon NFT Ticket. Tier: VIP Backstage & Artist Lounge.",
            ticketId: ticketInput,
            tier: "VIP Backstage & Lounge",
            token: 42,
          };
          setScanResult(res);
          setRecentLogs((prev) => [{ id: ticketInput, status: "VALID", time: new Date().toLocaleTimeString(), tier: "VIP Backstage" }, ...prev]);
        } else {
          const res: ScanResult = {
            valid: false,
            reason: "COUNTERFEIT / NOT FOUND",
            details: "Cryptographic HMAC signature does not match any valid ticket on-chain.",
            ticketId: ticketInput,
          };
          setScanResult(res);
          setRecentLogs((prev) => [{ id: ticketInput, status: "INVALID", time: new Date().toLocaleTimeString(), tier: "Unknown" }, ...prev]);
        }
      }
    }, 600);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mb-3">
          <QrCode className="h-6 w-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Festival Gate Check-in Scanner
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Staff entrance validator verifying cryptographic NFT tickets and preventing duplicate admissions.
        </p>
      </div>

      {/* Scanner Box */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl mb-8">
        <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950/60 p-8 text-center">
          <Camera className="h-10 w-10 text-neutral-500 mb-3 animate-pulse" />
          <p className="text-xs font-semibold text-neutral-300">Point Camera at Fan&apos;s Digital Pass</p>
          <p className="text-[11px] text-neutral-500 mt-1">Or enter/paste the pass signed hash below</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
              Pass ID or Cryptographic QR Hash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                placeholder="e.g. mc-pass-849102"
                className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm font-mono text-white placeholder-neutral-600 focus:border-purple-500 focus:outline-none"
              />
              <button
                onClick={handleScan}
                disabled={isVerifying}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
              >
                {isVerifying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Verify Gate Entry</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Scan Result Feedback Banner */}
        {scanResult && (
          <div className={`mt-6 rounded-2xl border p-5 transition-all ${
            scanResult.valid
              ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-300"
              : "border-red-500/50 bg-red-950/30 text-red-300"
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.valid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="text-base font-bold tracking-tight">
                  {scanResult.reason}
                </h3>
                <p className="text-xs mt-1 text-neutral-300 leading-relaxed">
                  {scanResult.details}
                </p>

                {scanResult.tier && (
                  <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                    <span className="text-white">Tier: {scanResult.tier}</span>
                    {scanResult.token && (
                      <span className="text-purple-400">NFT Token #{scanResult.token}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Gate Scan Activity */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-400" /> Recent Gate Admissions Log
        </h3>
        <div className="divide-y divide-neutral-800 text-xs">
          {recentLogs.map((log, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-mono text-neutral-300 font-semibold">{log.id}</span>
                <span className="text-neutral-500 ml-2">({log.tier})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neutral-500">{log.time}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  log.status === "VALID"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-950 text-red-400 border border-red-500/30"
                }`}>
                  {log.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
