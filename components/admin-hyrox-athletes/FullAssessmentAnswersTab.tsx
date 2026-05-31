"use client";

import { useMemo, useState } from "react";
import type { HyroxApplicationRow, HyroxAssessmentRow } from "@/app/lib/hyroxDatabaseTypes";
import type { HyroxAssessmentInput } from "@/app/lib/hyroxAthleteProfileTypes";
import {
  buildAdminAssessmentDisplay,
  buildRawAssessmentDebugPayload,
  type AdminAssessmentDisplayData,
} from "@/app/lib/hyroxAdminAssessmentDisplay";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";

type FullAssessmentAnswersTabProps = {
  athlete: {
    name: string;
    email: string;
    race_name?: string | null;
    race_date?: string | null;
    race_category?: string | null;
    target_time?: string | null;
  };
  assessmentRow?: HyroxAssessmentRow | null;
  assessmentInput?: HyroxAssessmentInput | null;
  applicationRow?: HyroxApplicationRow | null;
};

function DisplayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">{value}</dd>
    </div>
  );
}

function AssessmentSection({ section }: { section: AdminAssessmentDisplayData["sections"][number] }) {
  return (
    <DashCard>
      <SectionHeading title={section.title} />
      <dl className="grid gap-3 sm:grid-cols-2">
        {section.rows.map((row) => (
          <DisplayRow key={`${section.title}-${row.label}`} label={row.label} value={row.value} />
        ))}
      </dl>
    </DashCard>
  );
}

export function FullAssessmentAnswersTab({
  athlete,
  assessmentRow,
  assessmentInput,
  applicationRow,
}: FullAssessmentAnswersTabProps) {
  const [showRaw, setShowRaw] = useState(false);

  const display = useMemo(
    () =>
      buildAdminAssessmentDisplay({
        athlete,
        assessmentRow,
        assessmentInput,
        applicationRow,
      }),
    [athlete, assessmentRow, assessmentInput, applicationRow]
  );

  const rawDebug = useMemo(
    () => buildRawAssessmentDebugPayload({ assessmentRow, applicationRow }),
    [assessmentRow, applicationRow]
  );

  if (display.source === "none") {
    return (
      <DashCard>
        <SectionHeading title="Full assessment answers" />
        <p className="text-sm text-zinc-400">
          No submitted application or onboarding assessment is on file for this athlete yet.
        </p>
      </DashCard>
    );
  }

  return (
    <div className="space-y-4">
      <DashCard highlight>
        <SectionHeading title="Full assessment answers" />
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">
          Complete submitted intake for coach review before profile mapping and programme generation.
          Missing fields show as —.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1">
            Source:{" "}
            <span className="font-semibold text-zinc-300">
              {display.source === "both"
                ? "Application + assessment"
                : display.source === "application"
                ? "Application"
                : "Onboarding assessment"}
            </span>
          </span>
          {display.submittedAt ? (
            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1">
              Submitted:{" "}
              <span className="font-semibold text-zinc-300">
                {new Date(display.submittedAt).toLocaleString("en-GB")}
              </span>
            </span>
          ) : null}
        </div>
      </DashCard>

      {display.sections.map((section) => (
        <AssessmentSection key={section.title} section={section} />
      ))}

      {display.unmappedFields.length > 0 ? (
        <DashCard>
          <SectionHeading title="Additional submitted fields" />
          <p className="mb-4 text-sm text-zinc-500">
            Answers not mapped to a primary section — included so nothing submitted is hidden.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {display.unmappedFields.map((row) => (
              <DisplayRow key={row.label} label={row.label} value={row.value} />
            ))}
          </dl>
        </DashCard>
      ) : null}

      <DashCard>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="text-left text-sm font-semibold text-yellow-300 hover:text-yellow-200"
        >
          {showRaw ? "Hide raw data" : "Show raw data (admin debug)"}
        </button>
        {showRaw ? (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-400">
            {JSON.stringify(rawDebug, null, 2)}
          </pre>
        ) : null}
      </DashCard>
    </div>
  );
}
