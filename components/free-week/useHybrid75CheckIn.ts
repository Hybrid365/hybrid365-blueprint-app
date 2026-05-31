"use client";

import { useCallback, useEffect, useState } from "react";
import type { Hybrid75WeeklyCheckin } from "@/app/lib/hybrid75CheckinLogging";

export type CheckInFormState = {
  sessions_completed: string;
  proof_posts: string;
  energy_score: string;
  recovery_score: string;
  soreness_score: string;
  biggest_win: string;
  biggest_struggle: string;
  support_needed: string;
  interested_full_programme: boolean;
};

const emptyForm: CheckInFormState = {
  sessions_completed: "",
  proof_posts: "",
  energy_score: "7",
  recovery_score: "7",
  soreness_score: "5",
  biggest_win: "",
  biggest_struggle: "",
  support_needed: "",
  interested_full_programme: false,
};

function formFromCheckin(checkin: Hybrid75WeeklyCheckin | null): CheckInFormState {
  if (!checkin) return emptyForm;
  return {
    sessions_completed: checkin.sessions_completed?.toString() ?? "",
    proof_posts: checkin.proof_posts?.toString() ?? "",
    energy_score: checkin.energy_score?.toString() ?? "7",
    recovery_score: checkin.recovery_score?.toString() ?? "7",
    soreness_score: checkin.soreness_score?.toString() ?? "5",
    biggest_win: checkin.biggest_win ?? "",
    biggest_struggle: checkin.biggest_struggle ?? "",
    support_needed: checkin.support_needed ?? "",
    interested_full_programme: checkin.interested_full_programme ?? false,
  };
}

export function useHybrid75CheckIn(
  planId: string,
  enabled: boolean,
  athleteEmail?: string,
  athleteName?: string
) {
  const [checkin, setCheckin] = useState<Hybrid75WeeklyCheckin | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [form, setForm] = useState<CheckInFormState>(emptyForm);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !planId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/free-week/weekly-check-in?plan_id=${encodeURIComponent(planId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load check-in");
      setConfigured(data.configured !== false);
      setWeekStart(data.week_start ?? null);
      setCheckin(data.checkin ?? null);
      setForm(formFromCheckin(data.checkin ?? null));
      setSubmitted(Boolean(data.checkin));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load check-in");
    } finally {
      setLoading(false);
    }
  }, [enabled, planId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateField = useCallback(
    <K extends keyof CheckInFormState>(key: K, value: CheckInFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const submit = useCallback(async () => {
    if (!enabled || !planId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/free-week/weekly-check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          email: athleteEmail,
          name: athleteName,
          week_start: weekStart ?? undefined,
          sessions_completed: form.sessions_completed ? Number(form.sessions_completed) : null,
          proof_posts: form.proof_posts ? Number(form.proof_posts) : null,
          energy_score: form.energy_score ? Number(form.energy_score) : null,
          recovery_score: form.recovery_score ? Number(form.recovery_score) : null,
          soreness_score: form.soreness_score ? Number(form.soreness_score) : null,
          biggest_win: form.biggest_win,
          biggest_struggle: form.biggest_struggle,
          support_needed: form.support_needed,
          interested_full_programme: form.interested_full_programme,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit check-in");
      setCheckin(data.checkin ?? null);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit check-in");
    } finally {
      setSubmitting(false);
    }
  }, [enabled, planId, athleteEmail, athleteName, weekStart, form]);

  return {
    checkin,
    weekStart,
    form,
    configured,
    loading,
    submitting,
    submitted,
    error,
    refresh,
    updateField,
    submit,
  };
}
