"use client";

import { MOCK_RACE_PREP } from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  LockedBanner,
  PageContent,
  PageHeader,
  SectionTitle,
  athleteCard,
  athleteCardPadding,
  eyebrowClass,
} from "./athleteUi";

function PrepField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`${athleteCard} ${athleteCardPadding} ${className}`}>
      <p className={eyebrowClass}>{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{value}</p>
    </div>
  );
}

export function RacePrepPageView() {
  const locked = MOCK_RACE_PREP.locked;
  const meta = ATHLETE_PAGE_META.racePrep;

  return (
    <PageContent>
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={locked ? `${meta.subtitle} · Structure preview below` : meta.subtitle}
      />

      {locked ? (
        <LockedBanner
          title="Unlocks Week 8 of your block"
          description="Your race-day playbook — pacing, fuelling, taper and checklist — appears when you enter race-specific prep."
        />
      ) : null}

      <section className={locked ? "relative" : ""}>
        {locked ? (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-zinc-950/40 backdrop-blur-[1px]" />
        ) : null}
        <SectionTitle
          title="Your race playbook"
          description={locked ? "Preview of what you'll receive" : "Personalised for your target time"}
        />
        <div className={`grid gap-4 sm:grid-cols-2 ${locked ? "opacity-90" : ""}`}>
          <PrepField label="Target run pace" value={MOCK_RACE_PREP.targetRunPace} />
          <PrepField label="Station strategy" value={MOCK_RACE_PREP.stationStrategy} />
          <PrepField label="Fuelling plan" value={MOCK_RACE_PREP.fuelling} />
          <PrepField label="Taper plan" value={MOCK_RACE_PREP.taper} />
          <PrepField label="Race-day checklist" value={MOCK_RACE_PREP.raceDayChecklist} className="sm:col-span-2" />
        </div>
      </section>
    </PageContent>
  );
}
