"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Lock, Minus, Plus, RefreshCw, Trophy, X } from "lucide-react";
import type {
  Hybrid75ChallengeSessionLog,
  Hybrid75LeaderboardRow,
  Hybrid75PointAdjustment,
} from "@/app/lib/hybrid75ChallengeLogging";

const STORAGE_KEY = "hybrid75_admin_secret";

type LogStatusFilter = "pending" | "approved" | "rejected" | "all";

function authHeaders(secret: string): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function Hybrid75LeaderboardAdminClient() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  const [logs, setLogs] = useState<Hybrid75ChallengeSessionLog[]>([]);
  const [logFilter, setLogFilter] = useState<LogStatusFilter>("pending");
  const [rows, setRows] = useState<Hybrid75LeaderboardRow[]>([]);
  const [adjustments, setAdjustments] = useState<Hybrid75PointAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [adjEmail, setAdjEmail] = useState("");
  const [adjName, setAdjName] = useState("");
  const [adjPlanId, setAdjPlanId] = useState("");
  const [adjPoints, setAdjPoints] = useState("10");
  const [adjReason, setAdjReason] = useState("");
  const [adjSubmitting, setAdjSubmitting] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setSecret(stored);
  }, []);

  const isUnlocked = Boolean(secret);

  const refreshAll = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setActionError(null);
    try {
      const [logsRes, boardRes] = await Promise.all([
        fetch(`/api/admin/hybrid75/logs?status=${logFilter}`, { headers: authHeaders(secret) }),
        fetch("/api/admin/hybrid75/leaderboard", { headers: authHeaders(secret) }),
      ]);

      const logsData = await logsRes.json();
      const boardData = await boardRes.json();

      if (!logsRes.ok) throw new Error(logsData.error || "Failed to load logs");
      if (!boardRes.ok) throw new Error(boardData.error || "Failed to load leaderboard");

      setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
      setRows(Array.isArray(boardData.rows) ? boardData.rows : []);
      setAdjustments(Array.isArray(boardData.adjustments) ? boardData.adjustments : []);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to refresh data");
    } finally {
      setLoading(false);
    }
  }, [secret, logFilter]);

  useEffect(() => {
    if (isUnlocked) void refreshAll();
  }, [isUnlocked, refreshAll]);

  const unlock = async () => {
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await fetch("/api/admin/hybrid75/verify", {
        method: "POST",
        headers: authHeaders(secretInput.trim()),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid secret");
      }
      sessionStorage.setItem(STORAGE_KEY, secretInput.trim());
      setSecret(secretInput.trim());
      setSecretInput("");
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : "Invalid secret");
    } finally {
      setUnlocking(false);
    }
  };

  const lock = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setLogs([]);
    setRows([]);
  };

  const updateLogStatus = async (logId: string, status: "approved" | "rejected") => {
    if (!secret) return;
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/hybrid75/logs/approve", {
        method: "POST",
        headers: authHeaders(secret),
        body: JSON.stringify({ log_id: logId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update log");
      setActionMessage(`Log ${status}.`);
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update log");
    }
  };

  const applyAdjustment = async () => {
    if (!secret) return;
    const points = Number.parseInt(adjPoints, 10);
    if (!adjEmail.trim()) {
      setActionError("Athlete email is required.");
      return;
    }
    if (!adjReason.trim()) {
      setActionError("Reason is required.");
      return;
    }
    if (!Number.isInteger(points) || points === 0) {
      setActionError("Points must be a non-zero integer.");
      return;
    }

    setAdjSubmitting(true);
    setActionError(null);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/hybrid75/adjust-points", {
        method: "POST",
        headers: authHeaders(secret),
        body: JSON.stringify({
          email: adjEmail.trim(),
          name: adjName.trim() || undefined,
          plan_id: adjPlanId.trim() || undefined,
          points,
          reason: adjReason.trim(),
          created_by: "hybrid75-admin",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to apply adjustment");
      setActionMessage(`Applied ${points > 0 ? "+" : ""}${points} points.`);
      setAdjReason("");
      await refreshAll();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to apply adjustment");
    } finally {
      setAdjSubmitting(false);
    }
  };

  const pendingCount = useMemo(
    () => logs.filter((log) => log.status === "pending" && log.points_claimed > 0).length,
    [logs]
  );

  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#F4D23C]/15">
              <Lock className="h-6 w-6 text-[#F4D23C]" />
            </div>
            <h1 className="text-2xl font-bold text-white">Hybrid 75 Admin</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Enter your admin secret to manage proof approvals and leaderboard points.
            </p>
            <label htmlFor="admin-secret" className="mt-6 block text-sm font-semibold text-white">
              Admin secret
            </label>
            <input
              id="admin-secret"
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white"
              placeholder="Enter CHALLENGE_LOG_ADMIN_SECRET"
              onKeyDown={(e) => {
                if (e.key === "Enter") void unlock();
              }}
            />
            {unlockError ? <p className="mt-3 text-sm text-red-400">{unlockError}</p> : null}
            <button
              type="button"
              disabled={unlocking || !secretInput.trim()}
              onClick={() => void unlock()}
              className="mt-6 w-full rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-bold text-black disabled:opacity-50"
            >
              {unlocking ? "Checking…" : "Unlock admin panel"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800 bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F4D23C]">Internal admin</p>
            <h1 className="text-xl font-bold text-white">Hybrid 75 Leaderboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:border-[#F4D23C]/40"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={lock}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white"
            >
              Lock
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {actionError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </div>
        ) : null}
        {actionMessage ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {actionMessage}
          </div>
        ) : null}

        {/* Pending approvals */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Pending proof checks</h2>
              <p className="mt-1 text-sm text-zinc-500">{pendingCount} pending with points</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["pending", "approved", "rejected", "all"] as LogStatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setLogFilter(filter)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                    logFilter === filter
                      ? "bg-[#F4D23C] text-black"
                      : "border border-zinc-700 text-zinc-400"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No logs for this filter.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-zinc-800 bg-black/40 p-4 md:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{log.name || "Athlete"}</span>
                        <span className="text-xs text-zinc-500">{log.email || "—"}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            log.status === "pending"
                              ? "bg-amber-500/15 text-amber-300"
                              : log.status === "approved"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-red-500/15 text-red-300"
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white">{log.session_title}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                        <span>Type: {log.session_type}</span>
                        <span>Points: {log.points_claimed}</span>
                        <span>Proof: {log.proof_type}</span>
                        {log.rpe ? <span>RPE: {log.rpe}</span> : null}
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                      {log.proof_note ? (
                        <p className="text-xs text-zinc-500">Proof note: {log.proof_note}</p>
                      ) : null}
                      {log.notes ? <p className="text-xs text-zinc-500">Notes: {log.notes}</p> : null}
                      <p className="text-[10px] text-zinc-600">Plan: {log.plan_id}</p>
                    </div>

                    {log.status === "pending" && log.points_claimed > 0 ? (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void updateLogStatus(log.id, "approved")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/25"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateLogStatus(log.id, "rejected")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/25"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Trophy className="h-5 w-5 text-[#F4D23C]" />
            <div>
              <h2 className="text-lg font-bold text-white">Hybrid 75 Leaderboard</h2>
              <p className="text-sm text-zinc-500">
                Pending points are not counted in official totals until approved.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="min-w-full text-sm">
              <thead className="bg-black/50 text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 text-right">Approved</th>
                  <th className="px-4 py-3 text-right">Pending</th>
                  <th className="px-4 py-3 text-right">Adjustments</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-zinc-500">
                      No leaderboard entries yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.key} className="border-t border-zinc-800/80">
                      <td className="px-4 py-3 text-zinc-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.email || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{row.approved_points}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-300">
                        {row.pending_points}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-sky-300">
                        {row.adjustment_points > 0 ? "+" : ""}
                        {row.adjustment_points}
                      </td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-[#F4D23C]">
                        {row.total_points}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Manual adjustment */}
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <h2 className="text-lg font-bold text-white">Manual points adjustment</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Add bonus points or corrections. Adjustments apply immediately to official totals.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Top 3 timed bonus (+10)", points: 10, reason: "Top 3 timed challenge bonus" },
              { label: "Proof correction (-10)", points: -10, reason: "Proof correction after review" },
              { label: "Admin correction", points: 0, reason: "Admin correction" },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (preset.points !== 0) setAdjPoints(String(preset.points));
                  setAdjReason(preset.reason);
                }}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[#F4D23C]/40"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Athlete email *</label>
              <input
                value={adjEmail}
                onChange={(e) => setAdjEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Athlete name</label>
              <input
                value={adjName}
                onChange={(e) => setAdjName(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Plan ID</label>
              <input
                value={adjPlanId}
                onChange={(e) => setAdjPlanId(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Points (+/-)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjPoints(String(Math.abs(Number(adjPoints) || 10) * -1))}
                  className="rounded-xl border border-zinc-800 px-3 py-2.5 text-zinc-400 hover:text-white"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  value={adjPoints}
                  onChange={(e) => setAdjPoints(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={() => setAdjPoints(String(Math.abs(Number(adjPoints) || 10)))}
                  className="rounded-xl border border-zinc-800 px-3 py-2.5 text-zinc-400 hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-zinc-400">Reason *</label>
              <input
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={adjSubmitting}
            onClick={() => void applyAdjustment()}
            className="mt-5 rounded-xl bg-[#F4D23C] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
          >
            {adjSubmitting ? "Applying…" : "Apply adjustment"}
          </button>

          {adjustments.length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Recent adjustments
              </p>
              <div className="space-y-2">
                {adjustments.slice(0, 8).map((adj) => (
                  <div
                    key={adj.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-black/30 px-3 py-2 text-xs"
                  >
                    <span className="text-zinc-300">
                      {adj.email} · {adj.reason}
                    </span>
                    <span className={adj.points >= 0 ? "text-emerald-300" : "text-red-300"}>
                      {adj.points > 0 ? "+" : ""}
                      {adj.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
