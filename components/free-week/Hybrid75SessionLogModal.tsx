"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, X } from "lucide-react";
import type { FreePlanSession } from "@/app/lib/freePlanDashboard";
import {
  calculatePointsClaimed,
  getHybrid75LogSessionType,
  HYBRID75_INSTAGRAM_TAGS,
  type Hybrid75ChallengeSessionLog,
  type Hybrid75ProofType,
} from "@/app/lib/hybrid75ChallengeLogging";
import {
  FREE_WEEK_TELEGRAM_URL,
  HYBRID75_TELEGRAM_GROUP_LABEL,
} from "@/app/lib/freeWeekChallengeMode";

type Hybrid75SessionLogModalProps = {
  open: boolean;
  session: FreePlanSession | null;
  planId: string;
  athleteName: string;
  athleteEmail: string;
  existingLog?: Hybrid75ChallengeSessionLog | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
};

const PROOF_OPTIONS: { value: Hybrid75ProofType; label: string }[] = [
  { value: "telegram", label: "Telegram" },
  { value: "instagram", label: "Instagram tag" },
  { value: "both", label: "Both" },
  { value: "not_yet", label: "Not yet" },
];

export default function Hybrid75SessionLogModal({
  open,
  session,
  planId,
  athleteName,
  athleteEmail,
  existingLog,
  saving,
  onClose,
  onSave,
}: Hybrid75SessionLogModalProps) {
  const [completed, setCompleted] = useState(true);
  const [rpe, setRpe] = useState<number>(6);
  const [proofType, setProofType] = useState<Hybrid75ProofType>("not_yet");
  const [proofNote, setProofNote] = useState("");
  const [notes, setNotes] = useState("");
  const [copiedTags, setCopiedTags] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !session) return;
    setCompleted(existingLog?.completed ?? true);
    setRpe(existingLog?.rpe ?? 6);
    setProofType(existingLog?.proof_type ?? "not_yet");
    setProofNote(existingLog?.proof_note ?? "");
    setNotes(existingLog?.notes ?? "");
    setSavedMessage(null);
  }, [open, session, existingLog]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !session) return null;

  const sessionType = getHybrid75LogSessionType(session);
  if (!sessionType) return null;

  const previewPoints = calculatePointsClaimed(sessionType, completed, proofType);

  const handleSave = async () => {
    await onSave({
      plan_id: planId,
      email: athleteEmail,
      name: athleteName,
      session_id: session.scrollId,
      session_title: session.title,
      session_type: sessionType,
      completed,
      rpe: completed ? rpe : null,
      proof_type: proofType,
      proof_note: proofNote,
      notes,
    });

    if (!completed) {
      setSavedMessage("Session log saved.");
    } else if (proofType === "not_yet") {
      setSavedMessage("Logged — proof required before points count.");
    } else {
      setSavedMessage(`Logged — pending proof check · +${previewPoints} points pending`);
    }
  };

  const copyInstagramTags = async () => {
    try {
      await navigator.clipboard.writeText(HYBRID75_INSTAGRAM_TAGS);
      setCopiedTags(true);
      window.setTimeout(() => setCopiedTags(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4D23C]">Log Session</p>
            <h3 className="mt-1 text-lg font-bold text-white">{session.title}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {session.day} · {sessionType}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 rounded-xl border border-[#F4D23C]/20 bg-[#F4D23C]/5 px-4 py-3 text-sm text-white/75">
          To earn points, post proof in the Telegram group or tag {HYBRID75_INSTAGRAM_TAGS} on Instagram. Points are
          manually checked and approved at the end of each week.
        </p>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold text-white">Completed?</p>
            <div className="flex gap-2">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setCompleted(value)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    completed === value
                      ? "border-[#F4D23C]/40 bg-[#F4D23C]/10 text-[#F4D23C]"
                      : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  {value ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>

          {completed ? (
            <div>
              <label htmlFor="hybrid75-rpe" className="mb-2 block text-sm font-semibold text-white">
                RPE (1–10)
              </label>
              <input
                id="hybrid75-rpe"
                type="range"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full accent-[#F4D23C]"
              />
              <p className="mt-1 text-sm text-zinc-400">Selected: {rpe}/10</p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold text-white">Proof posted?</p>
            <div className="grid grid-cols-2 gap-2">
              {PROOF_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProofType(option.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    proofType === option.value
                      ? "border-[#F4D23C]/40 bg-[#F4D23C]/10 text-[#F4D23C]"
                      : "border-zinc-800 text-zinc-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="proof-note" className="mb-2 block text-sm font-semibold text-white">
              Proof note or link (optional)
            </label>
            <input
              id="proof-note"
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="Telegram post link, IG handle, etc."
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label htmlFor="session-notes" className="mb-2 block text-sm font-semibold text-white">
              Session notes (optional)
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2.5 text-sm text-white placeholder:text-zinc-600"
              placeholder="How did it feel? Anything to remember?"
            />
          </div>

          {previewPoints > 0 ? (
            <p className="text-sm font-semibold text-[#F4D23C]">+{previewPoints} points pending on save</p>
          ) : completed && proofType === "not_yet" ? (
            <p className="text-sm text-amber-300">Proof required before points are counted.</p>
          ) : null}

          {savedMessage ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {savedMessage}
            </p>
          ) : null}
        </div>

        <div className="mt-6 space-y-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="flex w-full items-center justify-center rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Log"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={FREE_WEEK_TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-semibold text-white hover:border-[#F4D23C]/40"
            >
              {HYBRID75_TELEGRAM_GROUP_LABEL}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => void copyInstagramTags()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-semibold text-white hover:border-[#F4D23C]/40"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiedTags ? "Copied tags" : "Copy Instagram Tags"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
