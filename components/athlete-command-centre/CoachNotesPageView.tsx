"use client";

import { ATHLETE_PAGE_META, PageContent, PageHeader, athleteCard, athleteCardPadding } from "./athleteUi";

export function CoachNotesPageView() {
  const meta = ATHLETE_PAGE_META.coachNotes;

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title="Coach notes"
        subtitle="Notes your coach publishes for you will show up here."
      />
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm leading-relaxed text-zinc-300">No coach notes available yet.</p>
      </div>
    </PageContent>
  );
}
