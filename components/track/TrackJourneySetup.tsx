"use client";

import TrackFoundationPreview from "@/components/track-foundation/TrackFoundationPreview";
import type { BenchmarkResultInput, TrackIntake } from "@/app/lib/track-foundation/types";
import { saveJourneyIntakeAction, saveJourneyResultAction } from "@/app/track/actions";

export default function TrackJourneySetup({
  intake,
  step,
  results,
  asOf,
}: {
  intake: TrackIntake;
  step: string;
  results: BenchmarkResultInput[];
  asOf: string;
}) {
  return (
    <TrackFoundationPreview
      initialFixture={null}
      initialScreen={null}
      journey
      initialIntake={intake}
      initialResults={results}
      initialStep={step}
      asOf={asOf}
      onSaveIntake={(next, savedStep) => saveJourneyIntakeAction(next, savedStep)}
      onSaveResult={(input) => saveJourneyResultAction(input)}
    />
  );
}
