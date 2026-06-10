"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Hybrid11ApplicationRow, Hybrid11ApplicationStatus } from "@/app/lib/hybrid11DatabaseTypes";
import {
  formatHybrid11ApplicationDate,
  suggestedHybrid11NextAction,
} from "@/app/lib/hybrid11ApplicationCoach";
import {
  HYBRID11_APPLICATION_TYPE_LABEL,
  HYBRID11_TRACK_LABEL,
} from "@/app/lib/hybrid11DatabaseTypes";
import { Hybrid11StatusBadge } from "@/components/admin-one-to-one-applications/Hybrid11StatusBadge";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === "—") return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function JsonSection({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null | undefined;
}) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <DashCard>
      <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-yellow-400/90">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(data).map(([key, value]) => (
          <DetailRow
            key={key}
            label={key.replace(/_/g, " ")}
            value={
              typeof value === "boolean"
                ? value
                  ? "Yes"
                  : "No"
                : String(value)
            }
          />
        ))}
      </div>
    </DashCard>
  );
}

export function Hybrid11ApplicationDetailClient({ applicationId }: { applicationId: string }) {
  const [application, setApplication] = useState<Hybrid11ApplicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coachNotes, setCoachNotes] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hybrid-1-1/applications/${applicationId}`);
      const data = (await res.json()) as {
        success?: boolean;
        application?: Hybrid11ApplicationRow;
        error?: string;
      };
      if (!res.ok || !data.application) {
        setError(data.error ?? "Could not load application.");
        setApplication(null);
        return;
      }
      setApplication(data.application);
      setCoachNotes(data.application.coach_notes ?? "");
    } catch {
      setError("Network error loading application.");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patchStatus(status: Hybrid11ApplicationStatus) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/hybrid-1-1/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, coach_notes: coachNotes }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        application?: Hybrid11ApplicationRow;
        error?: string;
      };
      if (!res.ok || !data.application) {
        setError(data.error ?? "Update failed.");
        return;
      }
      setApplication(data.application);
      setSuccess(`Status updated to ${status}.`);
    } catch {
      setError("Network error updating application.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNotes() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/hybrid-1-1/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coach_notes: coachNotes }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        application?: Hybrid11ApplicationRow;
        error?: string;
      };
      if (!res.ok || !data.application) {
        setError(data.error ?? "Could not save notes.");
        return;
      }
      setApplication(data.application);
      setSuccess("Coach notes saved.");
    } catch {
      setError("Network error saving notes.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading application…</p>;
  }

  if (error && !application) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        {error}
        <Link href="/admin/one-to-one-applications" className="mt-3 block text-yellow-400">
          ← Back to applications
        </Link>
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-400/90">
            {HYBRID11_APPLICATION_TYPE_LABEL} · {HYBRID11_TRACK_LABEL}
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white">{application.full_name}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Submitted {formatHybrid11ApplicationDate(application.created_at)}
          </p>
        </div>
        <Hybrid11StatusBadge status={application.status} />
      </div>

      {application.status === "accepted" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {suggestedHybrid11NextAction("accepted")}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      <DashCard>
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-yellow-400/90">
          Athlete details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Email" value={application.email} />
          <DetailRow label="Phone" value={application.phone} />
          <DetailRow label="Instagram" value={application.instagram ? `@${application.instagram}` : null} />
          <DetailRow label="Age" value={application.age} />
          <DetailRow label="Location" value={application.location} />
          <DetailRow label="Occupation" value={application.occupation} />
        </div>
      </DashCard>

      <DashCard>
        <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-yellow-400/90">Goals</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Main goal" value={application.main_goal} />
          <DetailRow label="Body composition goal" value={application.body_composition_goal} />
          <DetailRow label="Performance goal" value={application.performance_goal} />
          <DetailRow label="Target outcome (12–16 weeks)" value={application.target_outcome} />
          <DetailRow label="Why 1-1 coaching?" value={application.reason_for_applying} />
        </div>
      </DashCard>

      <JsonSection title="Training background" data={application.training_background} />
      <JsonSection title="Benchmarks" data={application.benchmarks} />
      <JsonSection title="Availability" data={application.availability} />
      <JsonSection title="Nutrition & lifestyle" data={application.nutrition_lifestyle} />
      <JsonSection title="Injuries & limitations" data={application.injuries_limitations} />
      <JsonSection title="Coaching fit" data={application.coaching_fit} />
      <JsonSection title="Consent" data={application.consent} />

      <DashCard>
        <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-yellow-400/90">
          Coach notes
        </h3>
        <textarea
          value={coachNotes}
          onChange={(e) => setCoachNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-200"
          placeholder="Internal notes…"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void saveNotes()}
          className="mt-3 rounded-full border border-zinc-600 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white disabled:opacity-50"
        >
          Save notes
        </button>
      </DashCard>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || application.status === "reviewing"}
          onClick={() => void patchStatus("reviewing")}
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-200 disabled:opacity-50"
        >
          Mark reviewing
        </button>
        <button
          type="button"
          disabled={busy || application.status === "accepted"}
          onClick={() => void patchStatus("accepted")}
          className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200 disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={busy || application.status === "rejected"}
          onClick={() => void patchStatus("rejected")}
          className="rounded-full border border-zinc-600 bg-zinc-800/50 px-4 py-2 text-xs font-bold text-zinc-300 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={busy || application.status === "converted"}
          onClick={() => void patchStatus("converted")}
          className="rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-xs font-bold text-violet-200 disabled:opacity-50"
        >
          Mark converted
        </button>
      </div>

      {application.raw_payload && Object.keys(application.raw_payload).length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-300"
          >
            {showRaw ? "Hide" : "Show"} raw payload
          </button>
          {showRaw ? (
            <pre className="mt-2 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-400">
              {JSON.stringify(application.raw_payload, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
