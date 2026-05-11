"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  Calendar,
  Activity,
  User,
  Dumbbell,
  AlertCircle,
  ChevronRight,
  Check,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Nav } from "@/components/nav";
import { postDashboardGenerateProgramme } from "@/app/lib/postDashboardGenerateProgramme";

export type AssessmentRow = {
  id: string;
  goal_focus: string | null;
  event_type: string | null;
  event_date: string | null;
  target_time: string | null;
  training_days_per_week: number | null;
  weekly_hours_band: string | null;
  preferred_training_days: string[] | null;
  double_session_days: string[] | null;
  current_running_volume_km: number | null;
  longest_recent_run_km: number | null;
  recent_5k_time: string | null;
  recent_10k_time: string | null;
  hyrox_pb: string | null;
  bodyweight_kg: number | null;
  target_bodyweight_kg: number | null;
  strength_experience: string | null;
  hyrox_experience: string | null;
  equipment: string[] | null;
  injury_flags: string[] | null;
  movements_to_avoid: string[] | null;
  biggest_limiter: string | null;
  notes: string | null;
  completed_at: string | null;
};

type Props = {
  programmeInstanceId: string | null;
  initialAssessment: AssessmentRow | null;
  hasGeneratedProgramme: boolean;
};

type SectionDef = {
  id: string;
  title: string;
  icon: ReactNode;
  isComplete: boolean;
};

/** Match mapper SESSION_LENGTH_TO_BAND — store canonical band in weekly_hours_band. */
const SESSION_LENGTH_PILL_TO_BAND: Record<string, string> = {
  "30-45 min": "3-5",
  "45-60 min": "5-7",
  "60-90 min": "7-10",
  "90+ min": "10+",
};

const BAND_TO_SESSION_PILL: Record<string, string> = {
  "3-5": "30-45 min",
  "5-7": "45-60 min",
  "7-10": "60-90 min",
  "10+": "90+ min",
};

/** Matches plan `DayKey` (Mon–Sun) for double_session_days / doubleSessionPlanner */
const DOUBLE_DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function normalizeStoredDoubleDay(raw: string): string | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const prefix = t.slice(0, 3);
  const map: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };
  return map[prefix] ?? null;
}

function initialDoubleSessionDaysFromAssessment(a: AssessmentRow | null): string[] {
  if (!a?.double_session_days?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of a.double_session_days) {
    const n = normalizeStoredDoubleDay(String(d));
    if (n && !seen.has(n)) {
      seen.add(n);
      out.push(n);
    }
  }
  return out;
}

function toggleArray(value: string, arr: string[]) {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

function toNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function experiencePillFromDb(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const t = raw.trim().toLowerCase();
  if (t === "elite") return "Elite";
  if (t === "advanced") return "Advanced";
  if (t === "intermediate") return "Intermediate";
  if (t === "beginner") return "Beginner";
  return raw.trim();
}

function SectionCard({
  title,
  icon,
  isComplete,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  icon: ReactNode;
  isComplete: boolean;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isComplete ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}
          >
            {icon}
          </div>
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          ) : null}
          <ChevronRight
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </div>
      </button>
      {expanded ? <div className="px-4 pb-4 pt-2 border-t border-border">{children}</div> : null}
    </div>
  );
}

function PillSelector({
  options,
  selected,
  onChange,
  multi = false,
}: {
  options: string[];
  selected: string | string[];
  onChange: (value: string) => void;
  multi?: boolean;
}) {
  const isSelected = (opt: string) =>
    multi ? (selected as string[]).includes(opt) : selected === opt;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            isSelected(option)
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function AssessmentClient({
  programmeInstanceId,
  initialAssessment,
  hasGeneratedProgramme,
}: Props) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>("goal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatingProgramme, setGeneratingProgramme] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateSuccess, setGenerateSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState(() => {
    const doubleSessionDays = initialDoubleSessionDaysFromAssessment(initialAssessment);
    return {
      goal: initialAssessment?.goal_focus ?? "",
      eventStatus: initialAssessment?.event_type ?? "",
      eventDate: initialAssessment?.event_date ?? "",
      targetTime: initialAssessment?.target_time ?? "",
      daysPerWeek:
        initialAssessment?.training_days_per_week != null
          ? `${initialAssessment.training_days_per_week} days`
          : "",
      sessionLength: (() => {
        const b = initialAssessment?.weekly_hours_band?.trim();
        if (!b) return "";
        return BAND_TO_SESSION_PILL[b] ?? b;
      })(),
      fiveKm: initialAssessment?.recent_5k_time ?? "",
      rowing: "",
      skiErg: "",
      weight:
        initialAssessment?.bodyweight_kg != null ? String(initialAssessment.bodyweight_kg) : "",
      height: "",
      experience: experiencePillFromDb(initialAssessment?.strength_experience),
      equipment: initialAssessment?.equipment ?? [],
      limitations: initialAssessment?.notes ?? "",
      priorities: initialAssessment?.injury_flags ?? [],
      doubleSessionsChoice: doubleSessionDays.length > 0 ? ("selected" as const) : ("none" as const),
      doubleSessionDays,
    };
  });

  async function onSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/dashboard/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programme_instance_id: programmeInstanceId,
          goal_focus: formData.goal || initialAssessment?.goal_focus || null,
          event_type: formData.eventStatus || initialAssessment?.event_type || null,
          event_date: formData.eventDate.trim() || null,
          target_time: formData.targetTime.trim() || null,
          training_days_per_week:
            toNumberOrNull(formData.daysPerWeek.replace(/[^\d.]/g, "")) ??
            initialAssessment?.training_days_per_week ??
            null,
          weekly_hours_band: (() => {
            const mapped = SESSION_LENGTH_PILL_TO_BAND[formData.sessionLength];
            if (mapped) return mapped;
            const trimmed = formData.sessionLength?.trim();
            if (trimmed) return trimmed;
            const fallback = initialAssessment?.weekly_hours_band?.trim();
            return fallback || null;
          })(),
          preferred_training_days: initialAssessment?.preferred_training_days ?? null,
          double_session_days: (() => {
            if (formData.doubleSessionsChoice !== "selected") return null;
            if (!formData.doubleSessionDays.length) return null;
            return formData.doubleSessionDays;
          })(),
          current_running_volume_km: initialAssessment?.current_running_volume_km ?? null,
          longest_recent_run_km: initialAssessment?.longest_recent_run_km ?? null,
          recent_5k_time: formData.fiveKm || initialAssessment?.recent_5k_time || null,
          recent_10k_time: initialAssessment?.recent_10k_time ?? null,
          hyrox_pb: initialAssessment?.hyrox_pb ?? null,
          bodyweight_kg:
            toNumberOrNull(formData.weight) ?? initialAssessment?.bodyweight_kg ?? null,
          target_bodyweight_kg: initialAssessment?.target_bodyweight_kg ?? null,
          strength_experience:
            formData.experience.trim()
              ? formData.experience.trim().toLowerCase()
              : initialAssessment?.strength_experience || null,
          hyrox_experience: initialAssessment?.hyrox_experience ?? null,
          equipment: formData.equipment.length > 0 ? formData.equipment : null,
          injury_flags: formData.priorities.length > 0 ? formData.priorities : null,
          movements_to_avoid: initialAssessment?.movements_to_avoid ?? null,
          biggest_limiter: initialAssessment?.biggest_limiter ?? null,
          notes: formData.limitations || null,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        console.error("assessment save failed", payload);
        throw new Error(payload.error || "Failed to save assessment");
      }
      await res.json();
      setSuccess("Assessment saved.");
      router.refresh();
    } catch (e) {
      console.error("assessment save error", e);
      setError(e instanceof Error ? e.message : "Unable to save assessment.");
    } finally {
      setSaving(false);
    }
  }

  const eventBooked =
    !!formData.eventStatus.trim() &&
    formData.eventStatus.trim().toLowerCase() !== "no event booked";
  const assessmentMarkedComplete = Boolean(initialAssessment?.completed_at || success);

  async function handleGenerateProgramme() {
    setGeneratingProgramme(true);
    setGenerateError(null);
    setGenerateSuccess(null);
    const result = await postDashboardGenerateProgramme();
    if (!result.ok) {
      setGenerateError(result.error);
      setGeneratingProgramme(false);
      return;
    }
    setGenerateSuccess(result.message ?? "Programme ready.");
    setGeneratingProgramme(false);
    router.push("/dashboard");
    router.refresh();
  }

  const sections: SectionDef[] = [
    {
      id: "goal",
      title: "Goal & Event",
      icon: <Target className="w-5 h-5" />,
      isComplete: !!formData.goal && !!formData.eventStatus,
    },
    {
      id: "availability",
      title: "Training Availability",
      icon: <Calendar className="w-5 h-5" />,
      isComplete: !!formData.daysPerWeek && !!formData.sessionLength,
    },
    {
      id: "performance",
      title: "Current Performance",
      icon: <Activity className="w-5 h-5" />,
      isComplete: !!formData.fiveKm,
    },
    {
      id: "body",
      title: "Body & Experience",
      icon: <User className="w-5 h-5" />,
      isComplete: !!formData.weight && !!formData.experience,
    },
    {
      id: "equipment",
      title: "Equipment Access",
      icon: <Dumbbell className="w-5 h-5" />,
      isComplete: formData.equipment.length > 0,
    },
    {
      id: "limitations",
      title: "Limitations & Priorities",
      icon: <AlertCircle className="w-5 h-5" />,
      isComplete: formData.priorities.length > 0,
    },
  ];

  const completedSections = sections.filter((s) => s.isComplete).length;
  const progressPercent = (completedSections / sections.length) * 100;

  return (
    <div className="flex min-h-screen bg-background">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="px-4 pt-6 pb-4 md:px-8 md:pt-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-primary font-semibold text-sm tracking-wide">HYBRID365</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Athlete Assessment</h1>

          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Profile Completion</span>
              <span className="text-sm font-semibold text-primary">{completedSections}/{sections.length}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {assessmentMarkedComplete && !hasGeneratedProgramme ? (
          <div className="px-4 md:px-8">
            <section className="mb-6 rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/[0.12] via-card to-card p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next step</p>
              <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">Assessment complete</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                You can now generate your personalised 12-week Hybrid365 programme. Baseline tests are optional but useful
                for tracking.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  disabled={generatingProgramme}
                  onClick={handleGenerateProgramme}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingProgramme ? "Generating…" : "Generate programme"}
                </button>
                <Link
                  href="/dashboard/testing"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
                >
                  Add baseline tests (optional)
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-xl border border-transparent px-5 py-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Back to dashboard
                </Link>
              </div>
              {generateError ? (
                <p className="mt-3 text-sm text-destructive">{generateError}</p>
              ) : null}
              {generateSuccess ? (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{generateSuccess}</p>
              ) : null}
            </section>
          </div>
        ) : null}

        <div className="px-4 md:px-8 space-y-3 pb-8">
          <SectionCard
            title="Goal & Event"
            icon={<Target className="w-5 h-5" />}
            isComplete={!!formData.goal && !!formData.eventStatus}
            expanded={expandedSection === "goal"}
            onToggle={() => setExpandedSection(expandedSection === "goal" ? null : "goal")}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Primary Goal</label>
                <PillSelector
                  options={[
                    "Improve Hybrid / Hyrox Performance",
                    "Run Faster / Improve Engine",
                    "Build Strength Without Losing Fitness",
                    "Lose Body Fat & Improve Fitness",
                    "General Hybrid Fitness",
                    "Prepare for a Specific Event",
                  ]}
                  selected={formData.goal}
                  onChange={(v) => setFormData({ ...formData, goal: v })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Event Status / Target</label>
                <PillSelector
                  options={[
                    "No event booked",
                    "Hyrox Open",
                    "Hyrox Pro",
                    "Hyrox Doubles",
                    "Running race",
                    "Triathlon",
                    "Other event",
                  ]}
                  selected={formData.eventStatus}
                  onChange={(v) => setFormData({ ...formData, eventStatus: v })}
                />
              </div>
              <div className={cn("grid gap-3 sm:grid-cols-2", !eventBooked && "opacity-75")}>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Event date {eventBooked ? "(recommended)" : "(optional)"}
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Target time {eventBooked ? "(recommended)" : "(optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1:24:00"
                    value={formData.targetTime}
                    onChange={(e) => setFormData({ ...formData, targetTime: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setExpandedSection("availability")}
                  className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
                >
                  Continue
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Training Availability" icon={<Calendar className="w-5 h-5" />} isComplete={!!formData.daysPerWeek && !!formData.sessionLength} expanded={expandedSection === "availability"} onToggle={() => setExpandedSection(expandedSection === "availability" ? null : "availability")}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Days Per Week</label>
                <PillSelector options={["3 days", "4 days", "5 days", "6 days", "7 days"]} selected={formData.daysPerWeek} onChange={(v) => setFormData({ ...formData, daysPerWeek: v })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Session Length</label>
                <PillSelector options={["30-45 min", "45-60 min", "60-90 min", "90+ min"]} selected={formData.sessionLength} onChange={(v) => setFormData({ ...formData, sessionLength: v })} />
              </div>
              <div className="rounded-xl border border-border/80 bg-secondary/30 p-4">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Can you train twice in one day?
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground/80">(optional)</span>
                </label>
                <PillSelector
                  options={["No double sessions", "Yes, on selected days"]}
                  selected={
                    formData.doubleSessionsChoice === "selected"
                      ? "Yes, on selected days"
                      : "No double sessions"
                  }
                  onChange={(v) =>
                    setFormData({
                      ...formData,
                      doubleSessionsChoice: v === "Yes, on selected days" ? "selected" : "none",
                      doubleSessionDays: v === "Yes, on selected days" ? formData.doubleSessionDays : [],
                    })
                  }
                />
                {formData.doubleSessionsChoice === "selected" ? (
                  <div className="mt-4 space-y-2">
                    <label className="text-sm text-muted-foreground mb-2 block">Select days</label>
                    <PillSelector
                      options={[...DOUBLE_DAY_KEYS]}
                      selected={formData.doubleSessionDays}
                      multi
                      onChange={(day) =>
                        setFormData({
                          ...formData,
                          doubleSessionDays: toggleArray(day, formData.doubleSessionDays),
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                      Double-session days are used mainly for low-cost aerobic, mobility, or support work — not extra
                      hard sessions.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setExpandedSection("performance")}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Continue
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Current Performance" icon={<Activity className="w-5 h-5" />} isComplete={!!formData.fiveKm} expanded={expandedSection === "performance"} onToggle={() => setExpandedSection(expandedSection === "performance" ? null : "performance")}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">5km Run Time</label>
                <input type="text" placeholder="e.g., 25:00" value={formData.fiveKm} onChange={(e) => setFormData({ ...formData, fiveKm: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">1km Row</label>
                  <input type="text" placeholder="e.g., 3:45" value={formData.rowing} onChange={(e) => setFormData({ ...formData, rowing: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">1km SkiErg</label>
                  <input type="text" placeholder="e.g., 4:00" value={formData.skiErg} onChange={(e) => setFormData({ ...formData, skiErg: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setExpandedSection("body")}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Continue
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Body & Experience" icon={<User className="w-5 h-5" />} isComplete={!!formData.weight && !!formData.experience} expanded={expandedSection === "body"} onToggle={() => setExpandedSection(expandedSection === "body" ? null : "body")}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Weight (kg)</label>
                  <input type="text" placeholder="e.g., 75" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Height (cm)</label>
                  <input type="text" placeholder="e.g., 180" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Experience Level</label>
                <PillSelector options={["Beginner", "Intermediate", "Advanced", "Elite"]} selected={formData.experience} onChange={(v) => setFormData({ ...formData, experience: v })} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setExpandedSection("equipment")}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Continue
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Equipment Access" icon={<Dumbbell className="w-5 h-5" />} isComplete={formData.equipment.length > 0} expanded={expandedSection === "equipment"} onToggle={() => setExpandedSection(expandedSection === "equipment" ? null : "equipment")}>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Available Equipment</label>
              <PillSelector options={["Full Gym", "Home Gym", "Minimal Equipment", "Outdoor Only"]} selected={formData.equipment} multi onChange={(v) => {
                const newEquipment = formData.equipment.includes(v) ? formData.equipment.filter((e) => e !== v) : [...formData.equipment, v];
                setFormData({ ...formData, equipment: newEquipment });
              }} />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setExpandedSection("limitations")}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary/80"
              >
                Continue
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Limitations & Priorities" icon={<AlertCircle className="w-5 h-5" />} isComplete={formData.priorities.length > 0} expanded={expandedSection === "limitations"} onToggle={() => setExpandedSection(expandedSection === "limitations" ? null : "limitations")}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Any Injuries or Limitations?</label>
                <textarea placeholder="Describe any physical limitations..." value={formData.limitations} onChange={(e) => setFormData({ ...formData, limitations: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Training Priorities</label>
                <PillSelector options={["Running", "Rowing", "SkiErg", "Strength", "Endurance", "Recovery"]} selected={formData.priorities} multi onChange={(v) => {
                  const newPriorities = formData.priorities.includes(v) ? formData.priorities.filter((p) => p !== v) : [...formData.priorities, v];
                  setFormData({ ...formData, priorities: newPriorities });
                }} />
              </div>
            </div>
          </SectionCard>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <button disabled={saving} className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-6" onClick={onSave}>
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </main>
    </div>
  );
}
