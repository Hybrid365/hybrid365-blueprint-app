"use client";

import Link from "next/link";
import { buildCoachActionQueue, type CoachActionItem, type CoachActionType } from "@/app/lib/hyroxCoachActionQueue";
import { DashCard } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  Eye,
  FileVideo,
  Flag,
  Upload,
} from "lucide-react";

const TYPE_ICONS: Record<CoachActionType, typeof Flag> = {
  programme_needs_review: Eye,
  check_in_submitted: ClipboardCheck,
  recovery_warning: AlertTriangle,
  testing_overdue: Flag,
  race_week_approaching: Calendar,
  programme_not_published: Upload,
  video_feedback_pending: FileVideo,
};

const PRIORITY_STYLES = {
  urgent: "border-red-500/35 bg-red-400/5",
  high: "border-orange-500/30 bg-orange-400/5",
  normal: "border-zinc-800 bg-zinc-900/40",
} as const;

export function CoachActionQueue({ items }: { items?: CoachActionItem[] }) {
  const queue = items ?? buildCoachActionQueue();

  if (queue.length === 0) {
    return (
      <DashCard>
        <h2 className="text-sm font-bold text-white">Coach action queue</h2>
        <p className="mt-2 text-sm text-zinc-500">No pending actions — roster is up to date.</p>
      </DashCard>
    );
  }

  return (
    <DashCard className="overflow-hidden p-0">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-bold text-white">Coach action queue</h2>
        <p className="text-[11px] text-zinc-500">{queue.length} items · mock priority order</p>
      </div>
      <ul className="max-h-[320px] divide-y divide-zinc-800/80 overflow-y-auto">
        {queue.map((item) => (
          <ActionRow key={item.id} item={item} />
        ))}
      </ul>
    </DashCard>
  );
}

function ActionRow({ item }: { item: CoachActionItem }) {
  const Icon = TYPE_ICONS[item.type];
  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-900/60 ${PRIORITY_STYLES[item.priority]}`}
      >
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-400/10 text-yellow-300">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold text-white">{item.title}</p>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-semibold uppercase text-zinc-400">
              {item.priority}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-yellow-200/90">{item.athleteName}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-zinc-500">{item.detail}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-zinc-600">Open →</span>
      </Link>
    </li>
  );
}
