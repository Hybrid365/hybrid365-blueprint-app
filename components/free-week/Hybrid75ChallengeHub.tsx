"use client";

import {
  Activity,
  CheckCircle2,
  Droplets,
  Dumbbell,
  MessageCircle,
  Trophy,
  UtensilsCrossed,
  Wind,
} from "lucide-react";
import type { Hybrid75PlanMeta } from "@/app/lib/freeWeekChallengeMode";
import { FREE_WEEK_TELEGRAM_URL, HYBRID75_RULES } from "@/app/lib/freeWeekChallengeMode";

type Hybrid75ChallengeHubProps = {
  hybrid75?: Hybrid75PlanMeta | null;
  scheduledCounts?: {
    runs: number;
    lifts: number;
    mobility: number;
  };
  completedCounts?: {
    runs: number;
    lifts: number;
    mobility: number;
    challenge: number;
  };
  pendingPoints?: number;
};

type TrackerRow = {
  label: string;
  current: number;
  target: number;
  suffix?: string;
  icon: React.ElementType;
};

function TrackerBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
      <div className="h-full rounded-full bg-[#F4D23C] transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function HubCard({
  title,
  children,
  accent = false,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 ${
        accent ? "border-[#F4D23C]/40 bg-[#F4D23C]/5" : "border-white/10 bg-zinc-950"
      }`}
    >
      {title ? <h3 className="mb-3 text-base font-semibold text-white">{title}</h3> : null}
      {children}
    </div>
  );
}

export default function Hybrid75ChallengeHub({
  hybrid75,
  scheduledCounts,
  completedCounts,
  pendingPoints = 0,
}: Hybrid75ChallengeHubProps) {
  const telegramUrl = hybrid75?.telegram_url ?? FREE_WEEK_TELEGRAM_URL;
  const scheduled = hybrid75?.scheduled_counts ?? scheduledCounts;

  const liftTarget = hybrid75?.targets?.lifts ?? 3;

  const trackerRows: TrackerRow[] = [
    { label: "Runs", current: completedCounts?.runs ?? 0, target: hybrid75?.targets?.runs ?? 3, icon: Activity },
    { label: "Lifts", current: completedCounts?.lifts ?? 0, target: liftTarget, icon: Dumbbell },
    { label: "Mobility", current: completedCounts?.mobility ?? 0, target: 1, icon: Wind },
    { label: "Hydration", current: 0, target: 7, suffix: "days", icon: Droplets },
    { label: "Clean eating", current: 0, target: 7, suffix: "days", icon: UtensilsCrossed },
    { label: "Proof posted", current: 0, target: 7, suffix: "days", icon: CheckCircle2 },
  ];

  return (
    <section className="mb-0">
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F4D23C]">
          Hybrid 75 Summer Challenge
        </p>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Hybrid 75 Challenge Hub</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
          Your free week is built around the Hybrid 75 rules — structured training plus daily habits and a weekend
          Hybrid Hard Challenge. Train with intent, stay accountable, and compete for prizes throughout the summer.
        </p>
        {hybrid75?.compression_note ? (
          <p className="mt-3 rounded-xl border border-[#F4D23C]/25 bg-[#F4D23C]/5 px-4 py-3 text-sm text-white/80">
            {hybrid75.compression_note}
          </p>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <HubCard title="Challenge rules">
          <ul className="space-y-2.5">
            {(hybrid75?.rules ?? HYBRID75_RULES).map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 text-sm text-white/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#F4D23C]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </HubCard>

        <HubCard title="Weekly progress">
          <div className="space-y-4">
            {trackerRows.map((row) => (
              <div key={row.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <row.icon className="h-4 w-4 text-[#F4D23C]" />
                    <span>{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {row.current}/{row.target}
                    {row.suffix ? ` ${row.suffix}` : ""}
                  </span>
                </div>
                <TrackerBar current={row.current} target={row.target} />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="text-sm text-white/80">Weekly challenge</span>
              <span className="rounded-full border border-[#F4D23C]/35 bg-[#F4D23C]/10 px-3 py-1 text-xs font-semibold text-[#F4D23C]">
                {(completedCounts?.challenge ?? 0) > 0 ? "Logged" : "Pending"}
              </span>
            </div>
            {pendingPoints > 0 ? (
              <p className="text-sm text-[#F4D23C]">
                {pendingPoints} points pending manual approval this week.
              </p>
            ) : null}
            {scheduled ? (
              <p className="text-xs text-white/50">
                Your plan includes {scheduled.runs} run(s), {scheduled.lifts} lift(s), and {scheduled.mobility}{" "}
                mobility session(s) this week. Log sessions on your dashboard and post proof in Telegram.
              </p>
            ) : null}
          </div>
        </HubCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <HubCard accent title="Join the free Telegram group">
          <p className="mb-4 text-sm leading-relaxed text-white/75">
            The weekly Hybrid Hard Challenge, score submission and leaderboard updates will be released inside the
            Telegram group.
          </p>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F4D23C] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Join Telegram
          </a>
        </HubCard>

        <HubCard title="Hybrid Hard Weekly Challenge">
          <p className="text-sm leading-relaxed text-white/75">
            Released every weekend inside Telegram. Complete it, post proof, and submit your score to qualify for
            prizes.
          </p>
        </HubCard>

        <HubCard title="Leaderboard">
          <p className="text-sm leading-relaxed text-white/75">
            Log sessions with proof on your dashboard, then check the Leaderboard tab for pending and approved
            points. Points are manually checked at the end of each week.
          </p>
        </HubCard>

        <HubCard>
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-[#F4D23C]" />
            <p className="text-sm leading-relaxed text-white/75">
              Complete the challenge, stay accountable and compete for prizes throughout the summer.
            </p>
          </div>
        </HubCard>
      </div>
    </section>
  );
}
