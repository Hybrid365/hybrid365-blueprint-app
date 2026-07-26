"use client";

import { Check } from "lucide-react";
import type { TodayChecklistItem } from "@/app/lib/hyrox-team/modules/today/checklist";

type Props = {
  items: TodayChecklistItem[];
  onAcknowledgeCoachNote?: () => void;
  acknowledging?: boolean;
};

export function TodayChecklist({ items, onAcknowledgeCoachNote, acknowledging }: Props) {
  if (!items.length) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
        Today checklist
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                item.done
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                  : "border-zinc-700 text-transparent"
              }`}
              aria-hidden
            >
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className={item.done ? "text-zinc-400 line-through" : "text-zinc-200"}>
              {item.label}
            </span>
            {item.id === "coach_note" && !item.done && onAcknowledgeCoachNote ? (
              <button
                type="button"
                disabled={acknowledging}
                onClick={onAcknowledgeCoachNote}
                className="ml-auto text-xs font-semibold text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
              >
                Mark reviewed
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
