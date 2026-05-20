"use client";

import { BookOpen, ChevronRight } from "lucide-react";
import { MOCK_RESOURCES } from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  PageContent,
  PageHeader,
  athleteCardInteractive,
  athleteCardPadding,
} from "./athleteUi";

export function ResourcesPageView() {
  const meta = ATHLETE_PAGE_META.resources;

  return (
    <PageContent>
      <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="grid gap-3 sm:grid-cols-2">
        {MOCK_RESOURCES.map((r) => (
          <button
            key={r.title}
            type="button"
            className={`group flex min-h-[120px] items-start gap-3 text-left ${athleteCardInteractive} ${athleteCardPadding}`}
          >
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400/80 transition group-hover:text-yellow-400" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white transition group-hover:text-yellow-100">{r.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{r.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-yellow-400" />
          </button>
        ))}
      </div>
    </PageContent>
  );
}
