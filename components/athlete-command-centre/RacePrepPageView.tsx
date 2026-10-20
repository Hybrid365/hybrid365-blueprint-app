"use client";

import { ATHLETE_PAGE_META, PageContent, PageHeader, athleteCard, athleteCardPadding } from "./athleteUi";

export function RacePrepPageView() {
  const meta = ATHLETE_PAGE_META.racePrep;

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle="Race-day pacing, fuelling and taper are not available yet."
      />
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm font-semibold text-white">Coming soon</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Race prep will appear here once it is built from your race date and programme. Nothing is
          prescribed on this page yet.
        </p>
      </div>
    </PageContent>
  );
}
