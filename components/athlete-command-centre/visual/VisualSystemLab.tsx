"use client";

import { BenchmarkCard } from "./BenchmarkCard";
import { MetricDelta } from "./MetricDelta";
import { PerformanceMetric } from "./PerformanceMetric";
import { ProgressChartCard } from "./ProgressChartCard";
import { SectionHeader } from "./SectionHeader";
import { SessionCompleteConfirm } from "./SessionCompleteConfirm";
import { SessionTarget, SessionTargetRow } from "./SessionTarget";
import { StatusPill } from "./StatusPill";
import { TrainingSummary } from "./TrainingSummary";
import { PerformanceProgressCard } from "./social/PerformanceProgressCard";
import { SessionCompleteCard } from "./social/SessionCompleteCard";
import { WeekInReviewCard } from "./social/WeekInReviewCard";
import { SOCIAL_PROTOTYPE_DEMO } from "./social/demoProps";
import { ConceptsLab } from "./concepts/ConceptsLab";
import { visualBody, visualEyebrow } from "./tokens";

/** Staging / development gallery. Every sample value is labelled as a prototype. */
export function VisualSystemLab() {
  const demo = SOCIAL_PROTOTYPE_DEMO;

  return (
    <div className="space-y-12 pb-16">
      <ConceptsLab />

      <header className="border-b border-zinc-800 pb-6">
        <p className={visualEyebrow}>Visual system</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Athlete primitives</h1>
        <p className={`mt-2 ${visualBody}`}>
          Prototype gallery. Cards below use labelled demo props, not live athlete results.
        </p>
      </header>

      <section>
        <SectionHeader eyebrow="Primitives" title="Performance and status" />
        <div className="grid gap-4 sm:grid-cols-2">
          <BenchmarkCard
            label="5K"
            value="17:55"
            derived="3:35/km"
            status="current"
            meta="Prototype value"
          />
          <div className="space-y-3">
            <PerformanceMetric label="FTP" value={null} status="pending" empty="No current value." />
            <div className="flex flex-wrap gap-2">
              <StatusPill status="current" />
              <StatusPill status="pending" />
              <StatusPill status="approved" />
              <StatusPill status="historical" />
            </div>
            <MetricDelta value="Prototype delta only when supplied" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <TrainingSummary
          title="This week"
          items={[
            { label: "Logged", value: "4", sub: "of 5 sessions" },
            { label: "Completion", value: "80%" },
          ]}
        />
        <ProgressChartCard
          title="Measured series"
          empty="No measured series yet."
          unit="km"
          series={[
            { label: "W1", value: 18 },
            { label: "W2", value: 21 },
            { label: "W3", value: 20 },
          ]}
        />
        <TrainingSummary
          title="Empty week"
          items={[]}
          empty="No sessions logged this week."
        />
        <ProgressChartCard
          title="Empty series"
          empty="No measured series yet."
          unit="km"
          series={[]}
        />
      </section>

      <section>
        <SectionHeader eyebrow="Session" title="Targets and completion" />
        <SessionTargetRow>
          <SessionTarget label="Duration" value="50 min" />
          <SessionTarget label="RPE" value="7" />
          <SessionTarget label="Pace" value="3:55/km" hint="Threshold" />
        </SessionTargetRow>
        <div className="mt-4">
          <SessionCompleteConfirm
            rpe="7"
            notes="Prototype note"
            actuals={[{ label: "Pace", value: "3:58/km" }]}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Social"
          title="9:16 prototypes"
          description="Staging-only. Each card is branded as a demo."
        />
        <div className="grid gap-8 lg:grid-cols-3">
          <SessionCompleteCard
            athleteName={demo.athleteName}
            sessionName={demo.sessionName}
            rpe={demo.rpe}
            duration={demo.duration}
            note={demo.note}
          />
          <WeekInReviewCard
            athleteName={demo.athleteName}
            weekLabel={demo.weekLabel}
            completed={demo.completed}
            planned={demo.planned}
            focus={demo.focus}
          />
          <PerformanceProgressCard
            athleteName={demo.athleteName}
            label={demo.benchmarkLabel}
            value={demo.benchmarkValue}
            derived={demo.benchmarkDerived}
            status={demo.benchmarkStatus}
          />
        </div>
      </section>
    </div>
  );
}
