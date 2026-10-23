"use client";

import { RaceHistoryAthleteView } from "./RaceHistoryAthleteView";
import { ATHLETE_PAGE_META, PageContent, PageHeader, athleteCard, athleteCardPadding } from "./athleteUi";

export function RacePrepPageView({ readOnly = false }: { readOnly?: boolean }) {
  const meta = ATHLETE_PAGE_META.racePrep;

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title="Race history"
        subtitle="Results you or your coach have recorded. Splits stay blank until they are entered — nothing is estimated."
      />
      <RaceHistoryAthleteView readOnly={readOnly} />
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm font-semibold text-white">Race week plan</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Race-day pacing, fuelling and taper are not built from this history yet. This page does
          not change your training.
        </p>
      </div>
    </PageContent>
  );
}
