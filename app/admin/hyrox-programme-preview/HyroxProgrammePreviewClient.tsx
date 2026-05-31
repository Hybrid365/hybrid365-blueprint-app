"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  HyroxEyebrow,
  HyroxH1,
  HyroxLead,
  HyroxPageShell,
  HyroxSection,
} from "@/components/hyrox-team/HyroxTeamUi";
import { DashCard, SectionHeading } from "@/components/hyrox-team/HyroxDashboardUi";
import {
  MOCK_HYROX_PROFILES,
  profileToClassificationInput,
  profileToProgrammeContext,
  type MockHyroxProfile,
  type MockHyroxProfileId,
} from "@/app/lib/hyroxPreviewMockProfiles";
import { classifyAthlete, CLASSIFICATION_LABELS } from "@/src/lib/hyrox/athleteClassification";
import {
  buildSessionSelectionHints,
  getApplicableProgrammeRules,
  getRecoveryAdjustmentSuggestions,
} from "@/src/lib/hyrox/programmeRules";
import type { ProgrammeRule } from "@/src/lib/hyrox/types";
import {
  calculateHyroxRunPaceEstimate,
  calculatePaceZones,
  estimate10kSecondsFrom5k,
} from "@/src/lib/hyrox/paceCalculator";
import {
  getStationWeaknessRules,
  rotateStationFocusForBlock,
} from "@/src/lib/hyrox/stationPersonalisation";
import {
  HYROX_SESSION_PROGRESSIONS,
  getSessionProgressionForWeek,
} from "@/src/lib/hyrox/sessionProgression";
import {
  applyBlockWeekDeload,
  applyRaceTimelineToStructure,
  suggestWeeklyStructure,
  weeksToRacePhase,
} from "@/src/lib/hyrox/weeklyStructureRules";
import { getHyroxSession } from "@/src/lib/hyrox/sessionLibrary";
import type { BlockWeekInCycle } from "@/src/lib/hyrox/types";
import { EditableProgrammeSandbox } from "@/components/admin/hyrox-programme-preview/EditableProgrammeSandbox";

const ROLE_DISPLAY: Record<string, string> = {
  easy_run: "Easy run / flush",
  hard_run: "Threshold run",
  long_aerobic: "Long aerobic (Z2)",
  erg_threshold: "SkiErg or RowErg threshold",
  erg_z2: "Bike / mixed erg Z2",
  strength_lower: "Lower strength + sled support",
  strength_upper: "Recovery aerobic + upper strength",
  compromised_hybrid: "Hyrox compromised session",
  recovery: "Recovery / mobility",
  rest: "Rest",
  testing: "Benchmark / testing",
};

const RULE_GROUPS: { title: string; match: (r: ProgrammeRule) => boolean }[] = [
  {
    title: "Block phase",
    match: (r) =>
      /block|week4|volume_before|session_block|block1/i.test(r.id) ||
      r.when.includes("programmeBlock") ||
      r.when.includes("blockWeek"),
  },
  {
    title: "Hard / easy",
    match: (r) => /grey|hard_easy|pace_hr/i.test(r.id),
  },
  {
    title: "Double sessions",
    match: (r) => /double/i.test(r.id),
  },
  {
    title: "Recovery",
    match: (r) => /recovery|sleep|poor_recovery/i.test(r.id),
  },
  {
    title: "Station weaknesses",
    match: (r) => /station/i.test(r.id),
  },
  {
    title: "Running / treadmill",
    match: (r) => /treadmill|outdoor|advanced_run|only_5k|threshold_rep/i.test(r.id),
  },
  {
    title: "Erg / aerobic",
    match: (r) => /erg|z2|bike|high_volume|time_restricted/i.test(r.id),
  },
];

function formatTimeDisplay(time: string | null, estimated?: boolean) {
  if (!time) return "—";
  return estimated ? `${time} (estimated)` : time;
}

function formatTenKmTotal(p: MockHyroxProfile) {
  if (p.tenKm) return { value: p.tenKm, estimated: false };
  const sec = estimate10kSecondsFrom5k(p.fiveKm);
  if (sec == null) return { value: "—", estimated: false };
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return { value: `${m}:${s.toString().padStart(2, "0")}`, estimated: true };
}

function doubleSessionLabel(r: MockHyroxProfile["doubleSessionReadiness"]) {
  const map: Record<MockHyroxProfile["doubleSessionReadiness"], string> = {
    not_ready: "Not ready",
    aerobic_double_only: "Aerobic doubles only",
    threshold_run_plus_easy_aerobic: "Threshold run + easy aerobic PM",
    threshold_run_plus_erg_threshold: "Threshold run + erg threshold PM",
  };
  return map[r];
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ProfilePreview({ profile }: { profile: MockHyroxProfile }) {
  const classification = useMemo(() => classifyAthlete(profileToClassificationInput(profile)), [profile]);
  const ctx = useMemo(
    () => profileToProgrammeContext(profile, classification.classification),
    [profile, classification]
  );
  const rules = useMemo(() => getApplicableProgrammeRules(ctx), [ctx]);
  const paceZones = useMemo(
    () => calculatePaceZones(profile.fiveKm, profile.tenKm),
    [profile]
  );
  const hyroxPace = useMemo(
    () => calculateHyroxRunPaceEstimate(profile.fiveKm, profile.abilityLevel),
    [profile]
  );
  const tenKm = formatTenKmTotal(profile);
  const weaknessFocus = rotateStationFocusForBlock(
    profile.stationWeaknesses,
    profile.blockWeek
  );
  const weaknessRules = getStationWeaknessRules(weaknessFocus);

  const weeklyStructure = useMemo(() => {
    const phase = weeksToRacePhase(profile.weeksToRace);
    let structure = suggestWeeklyStructure({
      trainingDaysAvailable: profile.trainingDays,
      classification: classification.classification,
      allowsDoubles: profile.allowsDoubles,
    });
    structure = applyRaceTimelineToStructure(structure, phase);
    structure = applyBlockWeekDeload(structure, profile.blockWeek);
    return structure;
  }, [profile, classification]);

  const recoverySuggestions = useMemo(() => {
    const base = getRecoveryAdjustmentSuggestions(ctx);
    if (profile.id !== "d") return base;
    return [
      ...base,
      "Swap Tuesday threshold run for 40–50 min easy bike (Z2).",
      "Move key run session 24 hours later if sleep remains poor.",
      "Remove any second threshold exposure this week.",
      "Reduce lower-body strength volume by ~30% — keep movement quality.",
    ];
  }, [ctx, profile.id]);

  const hints = useMemo(() => buildSessionSelectionHints(ctx), [ctx]);

  const keySessionDay =
    weeklyStructure.days.find((d) => d.role === "compromised_hybrid") ??
    weeklyStructure.days.find((d) => d.role === "hard_run");

  const filmSession =
    getHyroxSession("hyrox_compromised_run_wallballs") ??
    getHyroxSession("hyrox_compromised_mini_test");

  const groupedRules = RULE_GROUPS.map((g) => ({
    title: g.title,
    rules: rules.filter(g.match),
  })).filter((g) => g.rules.length > 0);

  const progressionFamilies = [
    { label: "Threshold run (6×6)", id: "hyrox_run_threshold_6x6" },
    { label: "Wall ball EMOM / builder", id: "hyrox_compromised_run_wallballs" },
    { label: "Compromised run", id: "hyrox_compromised_sled_burpee" },
    { label: "Sled work", id: "hyrox_strength_lower_sled" },
    { label: "Leg endurance", id: "hyrox_strength_heavy_legs" },
  ];

  return (
    <div className="space-y-8">
      {/* 3. Athlete input summary */}
      <DashCard>
        <SectionHeading title="Athlete input summary" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <Stat label="5km" value={profile.fiveKm} />
          <Stat
            label="10km"
            value={formatTimeDisplay(tenKm.value, tenKm.estimated)}
          />
          <Stat label="Training days" value={String(profile.trainingDays)} />
          <Stat label="Weekly hours" value={`${profile.weeklyTrainingHours}h`} />
          <Stat label="Race timeline" value={`${profile.weeksToRace} weeks out`} />
          <Stat
            label="Classification"
            value={CLASSIFICATION_LABELS[classification.classification]}
          />
          <Stat
            label="Station weaknesses"
            value={profile.stationWeaknesses.join(", ") || "None"}
          />
          <Stat label="Recovery" value={profile.recoveryStatus} />
          <Stat label="Sleep" value={profile.sleepQuality} />
          {profile.stressLevel ? (
            <Stat label="Stress" value={profile.stressLevel} />
          ) : null}
          <Stat label="Double sessions" value={doubleSessionLabel(profile.doubleSessionReadiness)} />
          <Stat label="Block" value={`Block ${profile.programmeBlock}`} />
          <Stat label="Block week" value={`Week ${profile.blockWeek} of 4`} />
          <Stat label="Max hard days" value={String(classification.maxHardDaysPerWeek)} />
        </div>
      </DashCard>

      {/* 4. Pace zones */}
      <DashCard highlight>
        <SectionHeading title="Pace zones" />
        {paceZones ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Stat label="Easy" value={paceZones.easy} />
            <Stat label="Steady" value={paceZones.steady} />
            <Stat label="Threshold" value={paceZones.threshold} />
            <Stat label="10km pace" value={paceZones.tenK} />
            <Stat label="5km pace" value={paceZones.fiveK} />
            <Stat label="Interval / VO2" value={paceZones.intervalVo2} />
            <Stat label="Hyrox race run (est.)" value={hyroxPace ?? paceZones.hyroxRaceRun} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">Could not compute zones from benchmark times.</p>
        )}
        <p className="mt-4 text-xs leading-relaxed text-zinc-500">
          Pace targets are estimates. HR/RPE should override pace if the athlete is fatigued or
          drifting above threshold. Source: {paceZones?.source ?? "n/a"}.
        </p>
      </DashCard>

      {/* 5. Programme rules */}
      <section>
        <SectionHeading title="Applicable programme rules" />
        <p className="mb-4 text-sm text-zinc-500">
          {rules.length} rules matched for this profile via{" "}
          <code className="text-yellow-400/90">getApplicableProgrammeRules</code>.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {groupedRules.map((group) => (
            <DashCard key={group.title} className="!p-4">
              <h4 className="m-0 text-sm font-bold text-yellow-400/90">{group.title}</h4>
              <ul className="m-0 mt-3 space-y-2 p-0">
                {group.rules.map((r) => (
                  <li key={r.id} className="list-none text-sm text-zinc-400">
                    <span
                      className={`mr-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.priority === "must"
                          ? "bg-red-500/20 text-red-300"
                          : r.priority === "should"
                            ? "bg-amber-500/20 text-amber-200"
                            : "bg-zinc-700 text-zinc-400"
                      }`}
                    >
                      {r.priority}
                    </span>
                    {r.then}
                  </li>
                ))}
              </ul>
            </DashCard>
          ))}
        </div>
      </section>

      {/* 6. Station weakness */}
      {weaknessRules.length > 0 ? (
        <section>
          <SectionHeading title="Station weakness actions" />
          {profile.stationWeaknesses.length > 1 ? (
            <p className="mb-4 text-sm text-zinc-400">
              Block week {profile.blockWeek} focus rotation:{" "}
              <span className="font-medium text-yellow-200">{weaknessFocus.join(", ")}</span>
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {weaknessRules.map((wr) => (
              <DashCard key={wr.weakness} className="!p-4">
                <p className="text-xs font-bold uppercase text-zinc-500">{wr.weakness}</p>
                <p className="mt-1 text-sm font-semibold text-white">{wr.earlyBlockFocus}</p>
                <p className="mt-2 text-xs text-zinc-500">Late block: {wr.lateBlockFocus}</p>
                <ul className="m-0 mt-3 space-y-1 p-0 text-xs text-zinc-400">
                  {wr.programmingActions.map((a) => (
                    <li key={a} className="list-none">
                      · {a}
                    </li>
                  ))}
                </ul>
                {wr.addOnExample ? (
                  <p className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-400/5 p-2 text-xs text-yellow-200/90">
                    Add-on: {wr.addOnExample}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] text-zinc-600">
                  Tags: {wr.sessionTags.join(", ")}
                </p>
              </DashCard>
            ))}
          </div>
        </section>
      ) : null}

      {/* 7. Progressions */}
      <section>
        <SectionHeading
          title="4-week key session progression"
          action={
            <span className="text-xs text-yellow-400">Current: Week {profile.blockWeek}</span>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {HYROX_SESSION_PROGRESSIONS.map((fam) => (
            <DashCard key={fam.family} className="!p-4">
              <h4 className="m-0 font-semibold text-white">{fam.family.replace(/_/g, " ")}</h4>
              <p className="mt-1 text-xs text-zinc-500">{fam.intent}</p>
              <div className="mt-4 space-y-2">
                {([1, 2, 3, 4] as BlockWeekInCycle[]).map((w) => {
                  const text = fam.weeks[`week${w}`];
                  const active = w === profile.blockWeek;
                  return (
                    <div
                      key={w}
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        active
                          ? "border-yellow-500/40 bg-yellow-400/10 text-yellow-100"
                          : "border-zinc-800 bg-zinc-950/50 text-zinc-400"
                      }`}
                    >
                      <span className="font-bold">Week {w}</span>
                      <span className="mx-2 text-zinc-600">·</span>
                      {text}
                    </div>
                  );
                })}
              </div>
            </DashCard>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {progressionFamilies.map((pf) => {
            const current = getSessionProgressionForWeek(pf.id, profile.blockWeek);
            return (
              <div
                key={pf.id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs"
              >
                <p className="font-semibold text-zinc-300">{pf.label}</p>
                <p className="mt-1 text-yellow-200/90">{current ?? "—"}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. Weekly structure */}
      <section>
        <SectionHeading title="Suggested weekly structure" />
        <p className="mb-2 text-sm text-zinc-400">{weeklyStructure.label}</p>
        <p className="mb-4 text-xs text-zinc-500">{weeklyStructure.description}</p>
        <p className="mb-4 text-xs text-zinc-600">{weeklyStructure.hardEasyRhythm}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {weeklyStructure.days.map((d) => (
            <DashCard
              key={d.day}
              className={`!p-4 ${
                d.intensity === "hard"
                  ? "!border-yellow-500/25"
                  : d.intensity === "rest"
                    ? "!opacity-50"
                    : ""
              }`}
            >
              <p className="text-xs font-bold uppercase text-yellow-400/80">{d.day}</p>
              <p className="mt-1 font-semibold text-white">
                {ROLE_DISPLAY[d.role] ?? d.role}
              </p>
              <p className="mt-1 text-[10px] capitalize text-zinc-500">{d.intensity}</p>
              {d.notes ? <p className="mt-2 text-xs text-zinc-500">{d.notes}</p> : null}
            </DashCard>
          ))}
        </div>
      </section>

      {/* 9. Recovery */}
      {recoverySuggestions.length > 0 ? (
        <DashCard className="border-amber-500/25">
          <SectionHeading title="Recovery adjustment preview" />
          <ul className="m-0 space-y-2 p-0">
            {recoverySuggestions.map((s) => (
              <li key={s} className="list-none text-sm text-zinc-300">
                · {s}
              </li>
            ))}
          </ul>
        </DashCard>
      ) : null}

      {/* 10. Dashboard translation */}
      <DashCard highlight>
        <SectionHeading title="Dashboard translation preview" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Main limiter</p>
            <p className="mt-1 text-sm text-white">
              {CLASSIFICATION_LABELS[classification.classification]}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Current focus</p>
            <p className="mt-1 text-sm text-zinc-300">
              {classification.suggestedFocus.join(" · ")}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Key session this week</p>
            <p className="mt-1 text-sm text-yellow-200">
              {keySessionDay
                ? `${keySessionDay.day}: ${ROLE_DISPLAY[keySessionDay.role] ?? keySessionDay.role}`
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase text-zinc-500">Coach note</p>
            <p className="mt-1 text-sm text-zinc-400">
              {weaknessRules[0]?.programmingActions[0] ??
                classification.rationale[0] ??
                "Build the base — protect easy days."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase text-zinc-500">
              What to film / document
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {filmSession?.filmPrompt ??
                "Film key station sets or threshold rep 1–2 for coach feedback."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] font-semibold uppercase text-zinc-500">
              Why this week is built this way
            </p>
            <ul className="m-0 mt-2 space-y-1 p-0 text-sm text-zinc-400">
              {hints.slice(0, 4).map((h) => (
                <li key={h.reason} className="list-none">
                  · {h.reason}
                </li>
              ))}
              {classification.rationale.slice(0, 2).map((r) => (
                <li key={r} className="list-none">
                  · {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DashCard>
    </div>
  );
}

export default function HyroxProgrammePreviewClient() {
  const [selectedId, setSelectedId] = useState<MockHyroxProfileId>("a");
  const profile = MOCK_HYROX_PROFILES.find((p) => p.id === selectedId)!;

  return (
    <HyroxPageShell maxWidth="max-w-6xl">
      <HyroxSection className="!py-6 sm:!py-8">
        <HyroxEyebrow>Internal · Admin</HyroxEyebrow>
        <HyroxH1 accent="portal">Hyrox Programme Logic Preview</HyroxH1>
        <HyroxLead>
          Test how athlete assessment data maps to programme priorities, paces, weekly structure
          and coaching notes.
        </HyroxLead>
        <Link
          href="/admin/hyrox-athletes/published-views"
          className="mt-4 inline-flex rounded-full border border-yellow-500/35 bg-yellow-400/10 px-4 py-2 text-xs font-semibold text-yellow-200 transition hover:bg-yellow-400/15"
        >
          View published athlete dashboards →
        </Link>
        <p className="mt-3 text-xs text-zinc-600">
          Mock profiles only — uses helpers from{" "}
          <code className="text-zinc-500">src/lib/hyrox</code>. Not connected to live athletes.
        </p>
      </HyroxSection>

      {/* 2. Mock athlete selector */}
      <section className="mb-8">
        <SectionHeading title="Mock athlete profiles" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_HYROX_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedId === p.id
                  ? "border-yellow-500/50 bg-yellow-400/10 ring-1 ring-yellow-500/30"
                  : "border-zinc-800 bg-zinc-900/80 hover:border-zinc-700"
              }`}
            >
              <p className="text-sm font-bold text-white">{p.shortLabel}</p>
              <p className="mt-2 text-xs text-zinc-500">
                5k {p.fiveKm}
                {p.tenKm ? ` · 10k ${p.tenKm}` : " · 10k est."}
              </p>
              <p className="mt-1 text-[10px] text-zinc-600">
                {p.trainingDays}d · {p.weeklyTrainingHours}h · {p.weeksToRace}wks out
              </p>
            </button>
          ))}
        </div>
      </section>

      <EditableProgrammeSandbox />

      <ProfilePreview profile={profile} />
    </HyroxPageShell>
  );
}
