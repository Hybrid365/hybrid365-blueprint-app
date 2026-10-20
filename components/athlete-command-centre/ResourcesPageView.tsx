"use client";

import { ATHLETE_PAGE_META, PageContent, PageHeader, athleteCard, athleteCardPadding } from "./athleteUi";

export function ResourcesPageView() {
  const meta = ATHLETE_PAGE_META.resources;

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle="Training resources are not available in the portal yet."
      />
      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <p className="text-sm font-semibold text-white">Coming soon</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Guides will be added here when they are ready to use. This page does not include personal
          recommendations yet.
        </p>
      </div>
    </PageContent>
  );
}
