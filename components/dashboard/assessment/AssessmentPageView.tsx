"use client";

import { type ReactNode } from "react";
import { Nav } from "@/components/nav";
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

const goals = ["Complete First Hyrox", "Podium Finish", "Personal Best", "General Fitness"];
const events = ["Hyrox Open", "Hyrox Pro", "Hyrox Doubles", "Hybrid Training Only"];
const daysPerWeek = ["3 days", "4 days", "5 days", "6 days", "7 days"];
const sessionLength = ["30-45 min", "45-60 min", "60-90 min", "90+ min"];
const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Elite"];
const equipment = ["Full Gym", "Home Gym", "Minimal Equipment", "Outdoor Only"];

export type AssessmentViewForm = {
  goal: string;
  event: string;
  daysPerWeek: string;
  sessionLength: string;
  fiveKm: string;
  rowing: string;
  skiErg: string;
  weight: string;
  height: string;
  experience: string;
  equipment: string[];
  limitations: string;
  priorities: string[];
};

interface SectionCardProps {
  title: string;
  icon: ReactNode;
  isComplete: boolean;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
}

function SectionCard({ title, icon, isComplete, children, expanded, onToggle }: SectionCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
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
          {isComplete && (
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          <ChevronRight
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        </div>
      </button>
      {expanded && <div className="px-4 pb-4 pt-2 border-t border-border">{children}</div>}
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

type Props = {
  formData: AssessmentViewForm;
  expandedSection: string | null;
  onToggleSection: (section: string) => void;
  onSetField: <K extends keyof AssessmentViewForm>(field: K, value: AssessmentViewForm[K]) => void;
  onToggleMulti: (field: "equipment" | "priorities", value: string) => void;
  onSave: () => void;
  saveLabel?: string;
  error?: string | null;
  success?: string | null;
};

export default function AssessmentPageView({
  formData,
  expandedSection,
  onToggleSection,
  onSetField,
  onToggleMulti,
  onSave,
  saveLabel = "Save Assessment",
  error,
  success,
}: Props) {
  const sections = [
    { id: "goal", isComplete: !!formData.goal && !!formData.event },
    { id: "availability", isComplete: !!formData.daysPerWeek && !!formData.sessionLength },
    { id: "performance", isComplete: !!formData.fiveKm },
    { id: "body", isComplete: !!formData.weight && !!formData.experience },
    { id: "equipment", isComplete: formData.equipment.length > 0 },
    { id: "limitations", isComplete: formData.priorities.length > 0 },
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
              <span className="text-sm font-semibold text-primary">
                {completedSections}/{sections.length}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="px-4 md:px-8 space-y-3 pb-8">
          <SectionCard
            title="Goal & Event"
            icon={<Target className="w-5 h-5" />}
            isComplete={!!formData.goal && !!formData.event}
            expanded={expandedSection === "goal"}
            onToggle={() => onToggleSection("goal")}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Primary Goal</label>
                <PillSelector options={goals} selected={formData.goal} onChange={(v) => onSetField("goal", v)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Target Event</label>
                <PillSelector options={events} selected={formData.event} onChange={(v) => onSetField("event", v)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Training Availability"
            icon={<Calendar className="w-5 h-5" />}
            isComplete={!!formData.daysPerWeek && !!formData.sessionLength}
            expanded={expandedSection === "availability"}
            onToggle={() => onToggleSection("availability")}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Days Per Week</label>
                <PillSelector
                  options={daysPerWeek}
                  selected={formData.daysPerWeek}
                  onChange={(v) => onSetField("daysPerWeek", v)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Session Length</label>
                <PillSelector
                  options={sessionLength}
                  selected={formData.sessionLength}
                  onChange={(v) => onSetField("sessionLength", v)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Current Performance"
            icon={<Activity className="w-5 h-5" />}
            isComplete={!!formData.fiveKm}
            expanded={expandedSection === "performance"}
            onToggle={() => onToggleSection("performance")}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">5km Run Time</label>
                <input
                  type="text"
                  placeholder="e.g., 25:00"
                  value={formData.fiveKm}
                  onChange={(e) => onSetField("fiveKm", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">1km Row</label>
                  <input
                    type="text"
                    placeholder="e.g., 3:45"
                    value={formData.rowing}
                    onChange={(e) => onSetField("rowing", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">1km SkiErg</label>
                  <input
                    type="text"
                    placeholder="e.g., 4:00"
                    value={formData.skiErg}
                    onChange={(e) => onSetField("skiErg", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Body & Experience"
            icon={<User className="w-5 h-5" />}
            isComplete={!!formData.weight && !!formData.experience}
            expanded={expandedSection === "body"}
            onToggle={() => onToggleSection("body")}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Weight (kg)</label>
                  <input
                    type="text"
                    placeholder="e.g., 75"
                    value={formData.weight}
                    onChange={(e) => onSetField("weight", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Height (cm)</label>
                  <input
                    type="text"
                    placeholder="e.g., 180"
                    value={formData.height}
                    onChange={(e) => onSetField("height", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Experience Level</label>
                <PillSelector
                  options={experienceLevels}
                  selected={formData.experience}
                  onChange={(v) => onSetField("experience", v)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Equipment Access"
            icon={<Dumbbell className="w-5 h-5" />}
            isComplete={formData.equipment.length > 0}
            expanded={expandedSection === "equipment"}
            onToggle={() => onToggleSection("equipment")}
          >
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Available Equipment</label>
              <PillSelector
                options={equipment}
                selected={formData.equipment}
                multi
                onChange={(v) => onToggleMulti("equipment", v)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Limitations & Priorities"
            icon={<AlertCircle className="w-5 h-5" />}
            isComplete={formData.priorities.length > 0}
            expanded={expandedSection === "limitations"}
            onToggle={() => onToggleSection("limitations")}
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Any Injuries or Limitations?</label>
                <textarea
                  placeholder="Describe any physical limitations..."
                  value={formData.limitations}
                  onChange={(e) => onSetField("limitations", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Training Priorities</label>
                <PillSelector
                  options={["Running", "Rowing", "SkiErg", "Strength", "Endurance", "Recovery"]}
                  selected={formData.priorities}
                  multi
                  onChange={(v) => onToggleMulti("priorities", v)}
                />
              </div>
            </div>
          </SectionCard>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

          <button
            type="button"
            onClick={onSave}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors mt-6"
          >
            <Save className="w-5 h-5" />
            {saveLabel}
          </button>
        </div>
      </main>
    </div>
  );
}
