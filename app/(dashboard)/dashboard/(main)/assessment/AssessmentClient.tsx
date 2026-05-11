"use client";

import { useState } from "react";
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
};

function toggleArray(value: string, arr: string[]) {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

function toNumberOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export default function AssessmentClient({ programmeInstanceId, initialAssessment }: Props) {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>("goal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    goal: initialAssessment?.goal_focus ?? "",
    event: initialAssessment?.event_type ?? "",
    daysPerWeek:
      initialAssessment?.training_days_per_week != null
        ? `${initialAssessment.training_days_per_week} days`
        : "",
    sessionLength: initialAssessment?.weekly_hours_band ?? "",
    fiveKm: initialAssessment?.recent_5k_time ?? "",
    rowing: "",
    skiErg: "",
    weight:
      initialAssessment?.bodyweight_kg != null ? String(initialAssessment.bodyweight_kg) : "",
    height: "",
    experience: initialAssessment?.strength_experience ?? "",
    equipment: initialAssessment?.equipment ?? [],
    limitations: initialAssessment?.notes ?? "",
    priorities: initialAssessment?.injury_flags ?? [],
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
          event_type: formData.event || initialAssessment?.event_type || null,
          event_date: initialAssessment?.event_date ?? null,
          target_time: initialAssessment?.target_time ?? null,
          training_days_per_week:
            toNumberOrNull(formData.daysPerWeek.replace(/[^\d.]/g, "")) ??
            initialAssessment?.training_days_per_week ??
            null,
          weekly_hours_band: formData.sessionLength || initialAssessment?.weekly_hours_band || null,
          preferred_training_days: initialAssessment?.preferred_training_days ?? null,
          double_session_days: initialAssessment?.double_session_days ?? null,
          current_running_volume_km: initialAssessment?.current_running_volume_km ?? null,
          longest_recent_run_km: initialAssessment?.longest_recent_run_km ?? null,
          recent_5k_time: formData.fiveKm || initialAssessment?.recent_5k_time || null,
          recent_10k_time: initialAssessment?.recent_10k_time ?? null,
          hyrox_pb: initialAssessment?.hyrox_pb ?? null,
          bodyweight_kg:
            toNumberOrNull(formData.weight) ?? initialAssessment?.bodyweight_kg ?? null,
          target_bodyweight_kg: initialAssessment?.target_bodyweight_kg ?? null,
          strength_experience:
            formData.experience || initialAssessment?.strength_experience || null,
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

  const sections = [
    { id: "goal", title: "Goal & Event", icon: <Target className="w-5 h-5" />, isComplete: !!formData.goal && !!formData.event },
    { id: "availability", title: "Training Availability", icon: <Calendar className="w-5 h-5" />, isComplete: !!formData.daysPerWeek && !!formData.sessionLength },
    { id: "performance", title: "Current Performance", icon: <Activity className="w-5 h-5" />, isComplete: !!formData.fiveKm },
    { id: "body", title: "Body & Experience", icon: <User className="w-5 h-5" />, isComplete: !!formData.weight && !!formData.experience },
    { id: "equipment", title: "Equipment Access", icon: <Dumbbell className="w-5 h-5" />, isComplete: formData.equipment.length > 0 },
    { id: "limitations", title: "Limitations & Priorities", icon: <AlertCircle className="w-5 h-5" />, isComplete: formData.priorities.length > 0 },
  ];

  const completedSections = sections.filter((s) => s.isComplete).length;
  const progressPercent = (completedSections / sections.length) * 100;

  function SectionCard({
    title,
    icon,
    isComplete,
    children,
    expanded,
    onToggle,
  }: {
    title: string;
    icon: React.ReactNode;
    isComplete: boolean;
    children: React.ReactNode;
    expanded?: boolean;
    onToggle?: () => void;
  }) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isComplete ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {icon}
            </div>
            <span className="font-medium text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {isComplete && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <ChevronRight className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )} />
          </div>
        </button>
        {expanded && (
          <div className="px-4 pb-4 pt-2 border-t border-border">
            {children}
          </div>
        )}
      </div>
    );
  }

  function PillSelector({
    options,
    selected,
    onChange,
    multi = false
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

        <div className="px-4 md:px-8 space-y-3 pb-8">
          <SectionCard title="Goal & Event" icon={<Target className="w-5 h-5" />} isComplete={!!formData.goal && !!formData.event} expanded={expandedSection === "goal"} onToggle={() => setExpandedSection(expandedSection === "goal" ? null : "goal")}>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Primary Goal</label>
                <PillSelector options={["Complete First Hyrox", "Podium Finish", "Personal Best", "General Fitness"]} selected={formData.goal} onChange={(v) => setFormData({ ...formData, goal: v })} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Target Event</label>
                <PillSelector options={["Hyrox Open", "Hyrox Pro", "Hyrox Doubles", "Hybrid Training Only"]} selected={formData.event} onChange={(v) => setFormData({ ...formData, event: v })} />
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
          </SectionCard>

          <SectionCard title="Equipment Access" icon={<Dumbbell className="w-5 h-5" />} isComplete={formData.equipment.length > 0} expanded={expandedSection === "equipment"} onToggle={() => setExpandedSection(expandedSection === "equipment" ? null : "equipment")}>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Available Equipment</label>
              <PillSelector options={["Full Gym", "Home Gym", "Minimal Equipment", "Outdoor Only"]} selected={formData.equipment} multi onChange={(v) => {
                const newEquipment = formData.equipment.includes(v) ? formData.equipment.filter((e) => e !== v) : [...formData.equipment, v];
                setFormData({ ...formData, equipment: newEquipment });
              }} />
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
