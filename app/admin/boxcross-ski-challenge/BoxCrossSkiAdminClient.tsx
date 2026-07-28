"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatSkiTime } from "@/app/lib/boxcross/time";
import type {
  BoxCrossSkiAttempt,
  BoxCrossSkiCategory,
  BoxCrossSkiChallenge,
  BoxCrossVerificationMethod,
} from "@/app/lib/boxcross/types";

const STORAGE_KEY = "boxcross_ski_admin_secret";

type AdminPayload = {
  challenge: BoxCrossSkiChallenge;
  attempts: BoxCrossSkiAttempt[];
};

type FormState = {
  athlete_name: string;
  category: BoxCrossSkiCategory;
  time: string;
  attempted_at: string;
  verification_method: BoxCrossVerificationMethod;
  verified: boolean;
  verified_by: string;
  witness_name: string;
  proof_url: string;
  internal_notes: string;
  created_by: string;
  allow_outside_period: boolean;
};

const emptyForm = (): FormState => ({
  athlete_name: "",
  category: "male",
  time: "",
  attempted_at: new Date().toISOString().slice(0, 16),
  verification_method: "staff_witnessed",
  verified: true,
  verified_by: "",
  witness_name: "",
  proof_url: "",
  internal_notes: "",
  created_by: "",
  allow_outside_period: false,
});

function authHeaders(secret: string): HeadersInit {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

export default function BoxCrossSkiAdminClient() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSecret(stored);
      setUnlocked(true);
    }
  }, []);

  const load = useCallback(async (token: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/admin/boxcross/challenge", {
        headers: authHeaders(token),
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.error || "Unauthorized");
        setUnlocked(false);
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      setData({ challenge: json.challenge, attempts: json.attempts });
      setUnlocked(true);
      sessionStorage.setItem(STORAGE_KEY, token);
    } catch {
      setAuthError("Failed to reach admin API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked && secret) void load(secret);
  }, [unlocked, secret, load]);

  const historyByAthlete = useMemo(() => {
    const map = new Map<string, BoxCrossSkiAttempt[]>();
    for (const a of data?.attempts ?? []) {
      const key = `${a.athlete_name.trim().toLowerCase()}::${a.category}`;
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [data]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    await load(secret.trim());
  }

  function startEdit(attempt: BoxCrossSkiAttempt) {
    setEditingId(attempt.id);
    setForm({
      athlete_name: attempt.athlete_name,
      category: attempt.category,
      time: formatSkiTime(attempt.time_ms),
      attempted_at: attempt.attempted_at.slice(0, 16),
      verification_method: attempt.verification_method,
      verified: attempt.verified,
      verified_by: attempt.verified_by ?? "",
      witness_name: attempt.witness_name ?? "",
      proof_url: attempt.proof_url ?? "",
      internal_notes: attempt.internal_notes ?? "",
      created_by: attempt.created_by ?? "",
      allow_outside_period: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
  }

  async function saveAttempt(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const body = {
      ...form,
      attempted_at: new Date(form.attempted_at).toISOString(),
      verified_by: form.verified_by || null,
      witness_name: form.witness_name || null,
      proof_url: form.proof_url || null,
      internal_notes: form.internal_notes || null,
      created_by: form.created_by || null,
    };

    const url = editingId
      ? `/api/admin/boxcross/attempts/${editingId}`
      : "/api/admin/boxcross/attempts";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders(secret),
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Save failed");
      return;
    }
    setMessage(editingId ? "Attempt updated" : "Attempt created");
    resetForm();
    await load(secret);
  }

  async function setVerified(attempt: BoxCrossSkiAttempt, verified: boolean) {
    const res = await fetch(`/api/admin/boxcross/attempts/${attempt.id}`, {
      method: "PATCH",
      headers: authHeaders(secret),
      body: JSON.stringify({
        verified,
        verified_by: form.verified_by || attempt.verified_by,
        allow_outside_period: true,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Update failed");
      return;
    }
    await load(secret);
  }

  async function removeAttempt(id: string) {
    if (!window.confirm("Remove this attempt permanently?")) return;
    const res = await fetch(`/api/admin/boxcross/attempts/${id}`, {
      method: "DELETE",
      headers: authHeaders(secret),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Delete failed");
      return;
    }
    if (editingId === id) resetForm();
    await load(secret);
  }

  async function markFinal() {
    if (!window.confirm("Mark challenge as FINAL? New entries will be blocked by default.")) return;
    const res = await fetch("/api/admin/boxcross/challenge", {
      method: "POST",
      headers: authHeaders(secret),
      body: JSON.stringify({ action: "mark_final" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "Failed to mark final");
      return;
    }
    setMessage("Challenge marked FINAL");
    await load(secret);
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] px-4 py-16 text-white">
        <form
          onSubmit={unlock}
          className="mx-auto max-w-md border border-zinc-800 bg-black p-6"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E10600]">
            BoxCross Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold uppercase tracking-wide">
            1KM Ski Challenge
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter the BoxCross admin secret to manage verified entries.
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-6 w-full border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm outline-none focus:border-[#E10600]"
            placeholder="Admin secret"
            autoComplete="current-password"
          />
          {authError ? <p className="mt-3 text-sm text-red-400">{authError}</p> : null}
          <button
            type="submit"
            className="mt-4 w-full bg-[#E10600] px-4 py-3 text-sm font-bold uppercase tracking-wider"
          >
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#E10600]">
              Authorised Admin
            </p>
            <h1 className="mt-1 text-3xl font-bold uppercase tracking-wide">
              BoxCross Ski Challenge
            </h1>
            {data ? (
              <p className="mt-2 text-sm text-zinc-400">
                Status: <span className="text-white">{data.challenge.status}</span>
                {" · "}
                {new Date(data.challenge.start_date).toLocaleDateString("en-GB")} →{" "}
                {new Date(data.challenge.end_date).toLocaleDateString("en-GB")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/boxcross-1km-ski-challenge"
              className="border border-zinc-700 px-3 py-2 text-xs font-bold uppercase tracking-wider"
              target="_blank"
              rel="noreferrer"
            >
              Public Page
            </a>
            <button
              type="button"
              onClick={() => void load(secret)}
              className="border border-zinc-700 px-3 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void markFinal()}
              className="border border-[#E10600] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#E10600]"
            >
              Mark Final
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 text-sm text-[#E10600]">{message}</p> : null}
        {loading ? <p className="mt-4 text-sm text-zinc-500">Loading…</p> : null}

        <form
          onSubmit={saveAttempt}
          className="mt-8 grid gap-4 border border-zinc-800 bg-black p-5 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-lg font-bold uppercase tracking-wide">
            {editingId ? "Edit Attempt" : "Add Verified Attempt"}
          </h2>

          <Field label="Athlete name">
            <input
              required
              value={form.athlete_name}
              onChange={(e) => setForm((f) => ({ ...f, athlete_name: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Category">
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as BoxCrossSkiCategory }))
              }
              className="admin-input"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="Time (e.g. 3:42.6)">
            <input
              required
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="admin-input"
              placeholder="3:42.6"
            />
          </Field>
          <Field label="Attempt date/time">
            <input
              required
              type="datetime-local"
              value={form.attempted_at}
              onChange={(e) => setForm((f) => ({ ...f, attempted_at: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Verification method">
            <select
              value={form.verification_method}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  verification_method: e.target.value as BoxCrossVerificationMethod,
                }))
              }
              className="admin-input"
            >
              <option value="staff_witnessed">Staff witnessed</option>
              <option value="full_video">Full video</option>
            </select>
          </Field>
          <Field label="Witness / staff">
            <input
              value={form.witness_name}
              onChange={(e) => setForm((f) => ({ ...f, witness_name: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Verified by">
            <input
              value={form.verified_by}
              onChange={(e) => setForm((f) => ({ ...f, verified_by: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Created by">
            <input
              value={form.created_by}
              onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Proof / video URL">
            <input
              value={form.proof_url}
              onChange={(e) => setForm((f) => ({ ...f, proof_url: e.target.value }))}
              className="admin-input"
            />
          </Field>
          <Field label="Internal notes">
            <input
              value={form.internal_notes}
              onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
              className="admin-input"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => setForm((f) => ({ ...f, verified: e.target.checked }))}
            />
            Verified (appears on public board)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.allow_outside_period}
              onChange={(e) =>
                setForm((f) => ({ ...f, allow_outside_period: e.target.checked }))
              }
            />
            Allow outside challenge period / final override
          </label>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="bg-[#E10600] px-5 py-3 text-xs font-bold uppercase tracking-wider"
            >
              {editingId ? "Save Changes" : "Add Entry"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="border border-zinc-700 px-5 py-3 text-xs font-bold uppercase tracking-wider"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="mt-10 overflow-x-auto border border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-950 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="px-3 py-3">Athlete</th>
                <th className="px-3 py-3">Cat</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Notes</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.attempts ?? []).map((a) => {
                const key = `${a.athlete_name.trim().toLowerCase()}::${a.category}`;
                const hist = historyByAthlete.get(key)?.length ?? 1;
                return (
                  <tr key={a.id} className="border-t border-zinc-900">
                    <td className="px-3 py-3">
                      <div className="font-semibold uppercase">{a.athlete_name}</div>
                      {hist > 1 ? (
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                          {hist} attempts on file
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 uppercase text-zinc-400">{a.category}</td>
                    <td className="px-3 py-3 tabular-nums">{formatSkiTime(a.time_ms)}</td>
                    <td className="px-3 py-3 text-zinc-400">
                      {new Date(a.attempted_at).toLocaleString("en-GB")}
                    </td>
                    <td className="px-3 py-3 text-xs uppercase text-zinc-400">
                      {a.verification_method === "full_video" ? "Video" : "Staff"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          a.verified ? "text-emerald-400" : "text-amber-400"
                        }
                      >
                        {a.verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-xs text-zinc-500">
                      {a.internal_notes || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(a)}
                          className="border border-zinc-700 px-2 py-1 text-[10px] uppercase"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void setVerified(a, !a.verified)}
                          className="border border-zinc-700 px-2 py-1 text-[10px] uppercase"
                        >
                          {a.verified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeAttempt(a.id)}
                          className="border border-red-900 px-2 py-1 text-[10px] uppercase text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data?.attempts.length ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No attempts yet. Add the first verified entry above.
            </p>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        :global(.admin-input) {
          width: 100%;
          border: 1px solid #3f3f46;
          background: #09090b;
          padding: 0.65rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.admin-input:focus) {
          border-color: #e10600;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs uppercase tracking-wider text-zinc-500">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
