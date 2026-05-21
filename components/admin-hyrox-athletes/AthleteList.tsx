"use client";

import { useState } from "react";
import { COACH_ATHLETES } from "@/app/lib/hyroxCoachMockAthletes";
import { AcceptedAthletesPanel } from "@/components/admin-hyrox-athletes/AcceptedAthletesPanel";
import { ApplicationsPanel } from "@/components/admin-hyrox-athletes/ApplicationsPanel";
import { CoachAdminShell } from "@/components/admin-hyrox-athletes/CoachAdminShell";
import { MockAthletesPanel } from "@/components/admin-hyrox-athletes/MockAthletesPanel";

type Tab = "applications" | "accepted" | "mock";

export function AthleteList() {
  const [tab, setTab] = useState<Tab>("applications");
  const [acceptedRefreshToken, setAcceptedRefreshToken] = useState(0);

  const needsReview = COACH_ATHLETES.filter(
    (a) =>
      a.listStatus === "needs_coach_review" ||
      a.listStatus === "draft_generated" ||
      a.listStatus === "profile_mapped" ||
      a.listStatus === "check_in_requires_adjustment"
  ).length;

  return (
    <CoachAdminShell
      title="Hyrox Team coach"
      actions={
        <div className="text-right text-xs text-zinc-500">
          {tab === "mock" ? (
            <>
              <p className="font-semibold text-yellow-400/90">{needsReview} need attention</p>
              <p>{COACH_ATHLETES.length} mock athletes</p>
            </>
          ) : tab === "accepted" ? (
            <p className="text-zinc-400">Live hyrox_athletes — payment &amp; linking</p>
          ) : (
            <p className="text-zinc-400">Live applications from Supabase</p>
          )}
        </div>
      }
    >
      <div className="flex gap-2 border-b border-zinc-800 pb-1">
        <button
          type="button"
          onClick={() => setTab("applications")}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
            tab === "applications"
              ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Applications
        </button>
        <button
          type="button"
          onClick={() => setTab("accepted")}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
            tab === "accepted"
              ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Accepted athletes
        </button>
        <button
          type="button"
          onClick={() => setTab("mock")}
          className={`rounded-t-lg px-4 py-2 text-sm font-bold transition ${
            tab === "mock"
              ? "bg-yellow-400/15 text-yellow-200 ring-1 ring-yellow-500/30"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Mock coach athletes
        </button>
      </div>

      <div className="mt-6">
        {tab === "applications" ? (
          <ApplicationsPanel
            onAcceptSuccess={() => {
              setAcceptedRefreshToken((t) => t + 1);
              setTab("accepted");
            }}
          />
        ) : tab === "accepted" ? (
          <AcceptedAthletesPanel refreshToken={acceptedRefreshToken} />
        ) : (
          <MockAthletesPanel />
        )}
      </div>
    </CoachAdminShell>
  );
}
