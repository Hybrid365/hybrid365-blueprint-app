"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Heart,
  Lock,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
  BarChart3,
  CheckCircle2,
  LineChart,
  MessageSquare,
  X,
  Sparkles,
  Wind,
  Gauge,
  Copy,
} from "lucide-react";

type SessionDetail = {
  day: string;
  dayShort: string;
  title: string;
  category: string;
  status: string;
  intent: string;
  duration: string;
  timeCap?: string;
  tags: string[];
  warmUp: string[];
  mainWork: string[];
  coolDown: string[];
  finisher?: string[];
  coachingNotes: string;
  rpeGuide: string;
  effortDescription: string;
  priorityRank: 1 | 2 | 3;
  priorityDisplayLabel: string;
  priorityCategoryLabel: string;
  priorityReason: string;
};

const DEFAULT_SESSION_PRIORITY = {
  priorityRank: 2 as const,
  priorityDisplayLabel: "Priority 2",
  priorityCategoryLabel: "Support Session",
  priorityReason: "This session supports the structure of your week.",
};

type AthleteDashboardClientProps = {
  planJson: any;
  planId: string;
};

function asArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v));
}

function dayShort(day: string): string {
  const s = (day || "").trim();
  if (!s) return "DAY";
  return s.slice(0, 3).toUpperCase();
}

function parseEquipment(value: unknown): string {
  if (Array.isArray(value) && value.length > 0) return value.map((v) => titleCase(String(v))).join(", ");
  if (typeof value === "string" && value.trim()) return titleCase(value);
  return "Not specified";
}

function titleCase(raw: string): string {
  return raw
    .replace(/[_-]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatName(raw: string): string {
  if (!raw) return "Athlete";
  return raw
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function formatTrainingDays(raw: string): string {
  if (!raw) return "Not set";
  const n = parseInt(raw, 10);
  if (!Number.isNaN(n)) return `${n} days/week`;
  return raw;
}

function mapCategory(title: string): SessionDetail["category"] {
  const lowered = title.toLowerCase();
  if (lowered.includes("run")) return "Run";
  if (lowered.includes("strength")) return "Strength";
  if (lowered.includes("recovery") || lowered.includes("rest")) return "Recovery";
  return "Hybrid";
}

function parseSessionPriority(raw: unknown): Pick<
  SessionDetail,
  "priorityRank" | "priorityDisplayLabel" | "priorityCategoryLabel" | "priorityReason"
> {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_SESSION_PRIORITY;
  }
  const p = raw as Record<string, unknown>;
  const rank = p.rank;
  if (rank !== 1 && rank !== 2 && rank !== 3) {
    return DEFAULT_SESSION_PRIORITY;
  }
  const fallbackCategory =
    rank === 1 ? "Key Session" : rank === 2 ? "Support Session" : "Optional / Flexible";
  const displayLabel =
    typeof p.display_label === "string" && p.display_label.trim()
      ? String(p.display_label).trim()
      : `Priority ${rank}`;
  const categoryLabel =
    typeof p.category_label === "string" && p.category_label.trim()
      ? String(p.category_label).trim()
      : fallbackCategory;
  const reason =
    typeof p.reason === "string" && p.reason.trim()
      ? String(p.reason).trim()
      : DEFAULT_SESSION_PRIORITY.priorityReason;

  return {
    priorityRank: rank,
    priorityDisplayLabel: displayLabel,
    priorityCategoryLabel: categoryLabel,
    priorityReason: reason,
  };
}

function PriorityChip({ rank, label }: { rank: 1 | 2 | 3; label: string }) {
  const styles =
    rank === 1
      ? "border-[#F4D23C] bg-[#F4D23C] font-semibold text-black shadow-[0_0_16px_rgba(244,210,60,0.12)]"
      : rank === 2
      ? "border-[#F4D23C]/35 bg-[#F4D23C]/12 text-[#F4D23C]"
      : "border-white/10 bg-white/[0.04] text-white/50";

  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center truncate rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight ${styles}`}
      title={label}
    >
      {label}
    </span>
  );
}

function normalizeSchedule(schedule: any[]): SessionDetail[] {
  return schedule.map((item) => {
    const session = item?.session || {};
    const minutes = typeof item?.time_cap_minutes === "number" ? item.time_cap_minutes : null;
    const notes = asArray(session?.notes);
    const title = String(item?.title || "Session");
    const category = mapCategory(title);
    const priority = parseSessionPriority(item?.priority);

    return {
      day: String(item?.day || "Day"),
      dayShort: dayShort(String(item?.day || "Day")),
      title,
      category,
      status: "Unlocked",
      intent: String(item?.intent || "Execute this session with controlled effort and clean form."),
      duration: minutes ? `${minutes} min` : "Use session guidance",
      timeCap: minutes ? `${minutes} min` : undefined,
      tags: asArray(item?.tags),
      warmUp: asArray(session?.warm_up),
      mainWork: asArray(session?.main),
      coolDown: asArray(session?.cool_down),
      finisher: asArray(session?.finish),
      coachingNotes: notes.length > 0 ? notes.join(" ") : "Use session guidance.",
      rpeGuide: "Use session guidance",
      effortDescription: String(
        item?.intent || "Respect the purpose of the session and keep the effort controlled."
      ),
      ...priority,
    };
  });
}

function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "accent" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        variant === "accent"
          ? "bg-[#F4D23C] text-black"
          : "border border-white/10 bg-zinc-900 text-white/70"
      }`}
    >
      {children}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex items-center gap-2 text-white/55">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SessionCard({ session, onClick }: { session: SessionDetail; onClick: () => void }) {
  const categoryColors: Record<string, string> = {
    Strength: "bg-[#F4D23C]/20 text-[#F4D23C]",
    Run: "bg-white/10 text-white",
    Hybrid: "bg-zinc-700/40 text-zinc-200",
    Recovery: "bg-zinc-800 text-zinc-300",
  };
  const categoryIcons: Record<string, React.ElementType> = {
    Strength: Dumbbell,
    Run: Activity,
    Hybrid: Zap,
    Recovery: Heart,
  };
  const Icon = categoryIcons[session.category] || Activity;

  return (
    <button
      onClick={onClick}
      className="group flex min-w-[180px] flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 text-left transition-all hover:border-[#F4D23C]/40 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F4D23C]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-white/60">{session.dayShort}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          <PriorityChip rank={session.priorityRank} label={session.priorityCategoryLabel} />
          <span className="rounded-full bg-[#F4D23C]/20 px-2 py-0.5 text-[10px] font-medium text-[#F4D23C]">
            {session.status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-white/55 group-hover:text-[#F4D23C]" />
        <p className="font-semibold text-white">{session.title}</p>
      </div>
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-medium ${
            categoryColors[session.category] || "bg-zinc-800 text-zinc-300"
          }`}
        >
          {session.category}
        </span>
        <ChevronRight className="h-4 w-4 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-[#F4D23C]" />
      </div>
    </button>
  );
}

function RoadmapCard({ week, title, locked }: { week: string; title: string; locked: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 p-5 transition-all ${
        locked ? "bg-zinc-950/60 opacity-60" : "bg-zinc-950"
      }`}
    >
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Lock className="h-6 w-6 text-white/70" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {!locked && <Zap className="h-4 w-4 text-[#F4D23C]" />}
          <span className={`text-sm font-semibold ${locked ? "text-white/55" : "text-[#F4D23C]"}`}>{week}</span>
          {!locked && <Badge variant="accent">Unlocked</Badge>}
        </div>
        <p className="text-white">{title}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4D23C]/10">
        <Icon className="h-5 w-5 text-[#F4D23C]" />
      </div>
      <span className="text-sm font-medium text-white">{title}</span>
    </div>
  );
}

function ReadinessRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg className="absolute h-full w-full -rotate-90">
        <circle cx="64" cy="64" r="45" className="fill-none stroke-zinc-800" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r="45"
          className="fill-none stroke-[#F4D23C]"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-white/60">/100</span>
      </div>
    </div>
  );
}

export default function AthleteDashboardClient({ planJson, planId }: AthleteDashboardClientProps) {
  const profile = planJson?.profile || {};
  const scheduleRaw: any[] = Array.isArray(planJson?.schedule) ? planJson.schedule : [];
  const sessions = useMemo(() => normalizeSchedule(scheduleRaw), [scheduleRaw]);
  const firstName = formatName(String(profile?.first_name || planJson?.first_name || ""));

  const athleteProfile = {
    name: firstName,
    goal: titleCase(String(profile?.goal || "Hybrid Performance")),
    level: titleCase(String(profile?.level || "Not set")),
    trainingDays: formatTrainingDays(String(profile?.training_days || "Not set")),
    weeklyHours: String(profile?.weekly_hours || "Not set"),
    runnerProfile: String(
      profile?.runner_profile?.label
        ? titleCase(String(profile.runner_profile.label))
        : "Use session guidance"
    ),
    equipment: parseEquipment(profile?.equipment),
    readinessScore: 72,
    currentBlock: "Build the Base",
    planStatus: "Free Week Active",
  };

  const nextSession = sessions[0] || null;

  const trainingBalance = useMemo(() => {
    const counts = { Running: 0, Strength: 0, Hybrid: 0, Recovery: 0 };
    for (const s of sessions) {
      if (s.category === "Run") counts.Running += 1;
      else if (s.category === "Strength") counts.Strength += 1;
      else if (s.category === "Recovery") counts.Recovery += 1;
      else counts.Hybrid += 1;
    }
    const total = Math.max(1, sessions.length);
    const toPct = (n: number) => Math.round((n / total) * 100);
    const base = [
      { label: "Running", percentage: toPct(counts.Running), color: "bg-[#F4D23C]" },
      { label: "Strength", percentage: toPct(counts.Strength), color: "bg-white" },
      { label: "Hybrid", percentage: toPct(counts.Hybrid), color: "bg-zinc-500" },
      { label: "Recovery", percentage: toPct(counts.Recovery), color: "bg-zinc-700" },
    ];
    const sum = base.reduce((acc, item) => acc + item.percentage, 0);
    if (sum !== 100) base[0].percentage += 100 - sum;
    return base;
  }, [sessions]);

  const roadmap = [
    { week: "Week 1", title: "Your personalised free week", locked: false },
    { week: "Weeks 2–4", title: "Build the Base", locked: true },
    { week: "Weeks 5–8", title: "Build the Engine", locked: true },
    { week: "Weeks 9–12", title: "Build Performance", locked: true },
  ];

  const dashboardFeatures = [
    { icon: CheckCircle2, title: "Session completion tracking" },
    { icon: TrendingUp, title: "Bodyweight trend graph" },
    { icon: Activity, title: "Running mileage tracking" },
    { icon: BarChart3, title: "Benchmark stats" },
    { icon: LineChart, title: "Weekly check-ins" },
    { icon: Users, title: "Community challenges" },
  ];

  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSessionClick = (session: SessionDetail) => {
    setSelectedSession(session);
    setDrawerOpen(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#F4D23C]">Hybrid365 Athlete Profile</p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            <span>{athleteProfile.name}&apos;s Hybrid365 Dashboard</span>
          </h1>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge>Free Profile</Badge>
            <Badge variant="accent">Week 1 Unlocked</Badge>
          </div>
          <p className="mb-8 max-w-2xl leading-relaxed text-white/70">
            Your free week is the starting point. The full Hybrid365 Blueprint unlocks progressive 4-week blocks.
          </p>

          <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:flex-row sm:items-center sm:gap-8">
            <ReadinessRing score={athleteProfile.readinessScore} />
            <div className="flex flex-1 flex-col gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Hybrid Readiness</p>
                <p className="text-2xl font-bold text-white">{athleteProfile.readinessScore}/100</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50">Current Block</p>
                  <p className="font-semibold text-white">{athleteProfile.currentBlock}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/50">Plan Status</p>
                  <p className="font-semibold text-[#F4D23C]">{athleteProfile.planStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12 rounded-2xl border border-[#F4D23C]/30 bg-zinc-950 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 max-w-2xl">
              <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg">Save this dashboard</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                This is your training hub for the week. Bookmark this page or save the email so you can come back to your
                sessions anytime.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:items-end">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    setLinkCopied(true);
                    window.setTimeout(() => setLinkCopied(false), 2500);
                  } catch {
                    setLinkCopied(false);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90 sm:min-w-[200px]"
              >
                {linkCopied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Link copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Dashboard Link
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Athlete Metrics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon={Target} label="Goal" value={athleteProfile.goal} />
            <StatCard icon={TrendingUp} label="Level" value={athleteProfile.level} />
            <StatCard icon={Calendar} label="Training" value={athleteProfile.trainingDays} />
            <StatCard icon={Clock} label="Weekly Hours" value={athleteProfile.weeklyHours} />
            <StatCard icon={Activity} label="Runner Profile" value={athleteProfile.runnerProfile} />
            <StatCard icon={Dumbbell} label="Equipment" value={athleteProfile.equipment} />
          </div>
        </section>

        {nextSession && (
          <section className="mb-12">
            <h2 className="mb-6 text-xl font-semibold text-white">Next Session</h2>
            <button
              onClick={() => handleSessionClick(nextSession)}
              className="w-full rounded-2xl border border-[#F4D23C]/30 bg-zinc-950 p-6 text-left transition-all hover:border-[#F4D23C]/50 hover:bg-white/[0.04] sm:p-8"
            >
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium uppercase tracking-wider text-[#F4D23C]">{nextSession.day}</span>
                <PriorityChip rank={nextSession.priorityRank} label={nextSession.priorityCategoryLabel} />
                <span className="text-white/50">—</span>
                <span className="min-w-0 flex-1 text-xl font-bold text-white sm:text-2xl">{nextSession.title}</span>
                <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-white/50" />
              </div>
              <p className="mb-6 leading-relaxed text-white/70">{nextSession.intent}</p>
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="inline-flex items-center gap-2">
                  <Timer className="h-4 w-4 text-white/55" />
                  {nextSession.duration}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Flame className="h-4 w-4 text-white/55" />
                  {nextSession.rpeGuide}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {nextSession.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          </section>
        )}

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">This Week Overview</h2>
          <p className="mb-4 text-sm text-white/60">Tap any session card to view full details</p>
          <div className="flex gap-3 overflow-x-auto pb-4">
            {sessions.map((session) => (
              <SessionCard key={`${session.dayShort}-${session.title}`} session={session} onClick={() => handleSessionClick(session)} />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Training Balance</h2>
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
            <div className="mb-6 flex h-4 overflow-hidden rounded-full bg-zinc-800">
              {trainingBalance.map((item) => (
                <div key={item.label} className={`${item.color} transition-all duration-500`} style={{ width: `${item.percentage}%` }} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {trainingBalance.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-white/65">{item.label}</span>
                  <span className="ml-auto text-sm font-semibold text-white">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Your Hybrid365 Roadmap</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roadmap.map((item) => (
              <RoadmapCard key={item.week} {...item} />
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <a
              href="https://plan.hybrid-365.com/community"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              Unlock Full Hybrid365 Blueprint
            </a>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-semibold text-white">Full Dashboard Preview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardFeatures.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#F4D23C]/30 bg-zinc-950 p-8 text-center sm:p-12">
          <Trophy className="mx-auto mb-6 h-12 w-12 text-[#F4D23C]" />
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
            One week gives you clarity. The full blueprint gives you progression.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-white/70">
            Join the Hybrid365 Community and unlock your complete training roadmap with progressive 4-week blocks
            tailored to your goals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://plan.hybrid-365.com/community"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-xl bg-[#F4D23C] px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Join Hybrid365 Community
            </a>
            <a
              href={`/plan/${planId}`}
              className="inline-flex items-center rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              View Full Free Week
            </a>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-8 text-center">
          <p className="text-sm text-white/55">© 2026 Hybrid365. Fast, Fit, Strong.</p>
        </footer>
      </div>

      {drawerOpen && selectedSession && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close session details"
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-white/15 bg-zinc-950">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <div className="mx-auto max-w-4xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 gap-y-1">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#F4D23C]">{selectedSession.day}</p>
                    <span className="text-xs font-semibold text-white/90 sm:text-sm">
                      {selectedSession.priorityDisplayLabel} — {selectedSession.priorityCategoryLabel}
                    </span>
                  </div>
                  <h3 className="mt-1 text-2xl font-bold text-white">{selectedSession.title}</h3>
                  <p className="mt-2 text-white/70">{selectedSession.intent}</p>
                  <div
                    className={`mt-3 rounded-2xl border p-3 text-sm leading-relaxed ${
                      selectedSession.priorityRank === 1
                        ? "border-[#F4D23C]/35 bg-[#F4D23C]/10 text-white/90"
                        : selectedSession.priorityRank === 2
                        ? "border-[#F4D23C]/20 bg-white/[0.04] text-white/80"
                        : "border-white/10 bg-black/20 text-white/60"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#F4D23C]/90">Session priority</p>
                    <p className="mt-1 text-sm">{selectedSession.priorityReason}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/[0.04] p-2 text-sm text-white/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/50">
                    <Timer className="h-4 w-4" /> Duration
                  </p>
                  <p className="mt-1 font-semibold text-white">{selectedSession.duration}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/50">
                    <Clock className="h-4 w-4" /> Time Cap
                  </p>
                  <p className="mt-1 font-semibold text-white">{selectedSession.timeCap || "Use session guidance"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/50">
                    <Gauge className="h-4 w-4" /> RPE
                  </p>
                  <p className="mt-1 font-semibold text-white">{selectedSession.rpeGuide}</p>
                </div>
              </div>

              {selectedSession.tags.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-[0.12em] text-white/50">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSession.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {[
                ["Warm-up", selectedSession.warmUp],
                ["Main Work", selectedSession.mainWork],
                ["Cool-down", selectedSession.coolDown],
                ["Finish", selectedSession.finisher],
                ["Coaching Notes", selectedSession.coachingNotes ? [selectedSession.coachingNotes] : []],
              ].map(([label, lines]) =>
                Array.isArray(lines) && lines.length > 0 ? (
                  <div key={String(label)} className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">
                      {label === "Warm-up" && <Wind className="mr-2 inline h-4 w-4 text-[#F4D23C]" />}
                      {label === "Main Work" && <Flame className="mr-2 inline h-4 w-4 text-[#F4D23C]" />}
                      {label === "Cool-down" && <Heart className="mr-2 inline h-4 w-4 text-white/60" />}
                      {label === "Finish" && <Sparkles className="mr-2 inline h-4 w-4 text-[#F4D23C]" />}
                      {label === "Coaching Notes" && <MessageSquare className="mr-2 inline h-4 w-4 text-[#F4D23C]" />}
                      {String(label)}
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-white/75">
                      {lines.map((line) => (
                        <li key={line}>
                          <span className="text-[#F4D23C]">-</span> {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null
              )}

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-semibold text-white">
                  <Gauge className="mr-2 inline h-4 w-4 text-[#F4D23C]" />
                  Effort Guide
                </p>
                <p className="mt-2 text-sm text-white/75">{selectedSession.effortDescription}</p>
              </div>

              <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/40"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                    Mark Complete
                  </button>
                  <a
                    href="https://plan.hybrid-365.com/community"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-[#F4D23C] px-4 py-2.5 text-center text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Unlock Tracking Features
                  </a>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {["Log RPE", "Add Session Notes", "Track Completion Streak"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-[#F4D23C]/80" aria-hidden />
                        <span className="truncate text-xs font-medium text-white/85">{label}</span>
                      </div>
                      <span className="shrink-0 rounded-full border border-[#F4D23C]/25 bg-[#F4D23C]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F4D23C]">
                        Locked
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-center text-xs leading-relaxed text-white/55">
                  Completion tracking unlocks inside the full Hybrid365 Athlete Dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
