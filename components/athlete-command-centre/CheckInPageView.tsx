"use client";

import { Moon, Scale, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { formatSubmittedDate } from "@/app/lib/hyroxAthleteCheckInServer";
import type { CheckInPageServerDebug } from "@/app/lib/hyroxAthleteCheckInPageServer";
import type {
  AthleteCheckInFormState,
  AthleteCheckInSummary,
  AthleteWeeklyCheckInView,
} from "@/app/lib/hyroxAthleteCheckInServer";
import { MOCK_CHECK_IN, MOCK_CHECK_IN_FORM } from "@/app/lib/hyroxTeamDashboardMock";
import {
  ATHLETE_PAGE_META,
  BtnPrimary,
  PageContent,
  PageHeader,
  SectionTitle,
  StatusBadge,
  athleteCard,
  athleteCardHighlight,
  athleteCardPadding,
} from "./athleteUi";
import { useAthletePortal } from "./athletePortalContext";
import { useAthleteWeeklyCheckIn } from "./useAthleteWeeklyCheckIn";

export function CheckInPageView({
  initialCheckIn = null,
  initialSummary = null,
  serverDebug = null,
  serverResolved = false,
}: {
  initialCheckIn?: AthleteWeeklyCheckInView | null;
  initialSummary?: AthleteCheckInSummary | null;
  serverDebug?: CheckInPageServerDebug | null;
  serverResolved?: boolean;
}) {
  const meta = ATHLETE_PAGE_META.checkin;
  const {
    programmePublishedLive,
    useMockPreview,
    reloadLiveProgramme,
    liveProgramme,
    serverAuthConfirmed,
    serverProgrammePublishedSeed,
    hasLinkedAthlete,
  } = useAthletePortal();

  const programmeLive =
    programmePublishedLive || serverProgrammePublishedSeed || Boolean(liveProgramme?.published);
  const useLive = programmeLive && !useMockPreview;

  const { checkIn, loading, saving, error, submit, useMockPreview: mock } =
    useAthleteWeeklyCheckIn(useLive, {
      initialCheckIn,
      initialSummary,
    });

  const activeCheckIn = checkIn ?? initialCheckIn;

  const currentWeekFromProgramme =
    activeCheckIn?.weekNumber ??
    serverDebug?.selectedWeekNumber ??
    liveProgramme?.liveGlobalWeek ??
    liveProgramme?.weeklyCheckIn?.weekNumber ??
    liveProgramme?.athlete?.current_week ??
    null;

  const mockForm = MOCK_CHECK_IN_FORM;
  const weekNumber =
    useLive && currentWeekFromProgramme != null ? currentWeekFromProgramme : 1;
  const statusLabel =
    useLive && activeCheckIn
      ? activeCheckIn.statusLabel
      : mockForm.status === "Submitted"
        ? "Completed"
        : "Needs completing";
  const isCompleted =
    useLive && activeCheckIn
      ? activeCheckIn.status === "completed"
      : mockForm.status === "Submitted";
  const needsCompleting =
    useLive && activeCheckIn
      ? activeCheckIn.status === "needs_completing"
      : !isCompleted;
  const isLocked = useLive && activeCheckIn ? activeCheckIn.status === "locked" : false;

  const initialForm: AthleteCheckInFormState =
    useLive && activeCheckIn
      ? activeCheckIn.form
    : {
        sleep: mockForm.sleep,
        energy: mockForm.energy,
        stress: mockForm.stress,
        soreness: mockForm.soreness,
        recovery: mockForm.recovery,
        bodyweightKg: mockForm.bodyweightKg,
        painNiggles: mockForm.painNiggles,
        biggestWin: mockForm.biggestWin,
        biggestStruggle: mockForm.biggestStruggle,
        nextWeekAvailability: mockForm.nextWeekAvailability,
      };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (useLive && activeCheckIn) {
      setForm(activeCheckIn.form);
    }
  }, [useLive, activeCheckIn]);

  const sessionsCompleted =
    useLive && activeCheckIn ? activeCheckIn.sessionsCompleted : mockForm.sessionsCompleted;
  const sessionsPlanned =
    useLive && activeCheckIn ? activeCheckIn.sessionsPlanned : mockForm.sessionsPlanned;
  const completionPct = sessionsPlanned
    ? Math.round((sessionsCompleted / sessionsPlanned) * 100)
    : 0;

  const submittedAtLabel =
    useLive && activeCheckIn?.submittedAt
      ? formatSubmittedDate(activeCheckIn.submittedAt)
      : null;

  const headerSubtitle = useLive
    ? `Week ${weekNumber} check-in`
    : meta.subtitle;

  const handleSubmit = async () => {
    if (mock || isLocked || isCompleted) return;
    if (!useLive) {
      return;
    }
    const ok = await submit({
      sleep: form.sleep,
      energy: form.energy,
      stress: form.stress,
      soreness: form.soreness,
      recovery: form.recovery,
      bodyweight: form.bodyweightKg,
      painNiggles: form.painNiggles,
      biggestWin: form.biggestWin,
      biggestStruggle: form.biggestStruggle,
      nextWeekAvailability: form.nextWeekAvailability,
    });
    if (ok) {
      void reloadLiveProgramme();
    }
  };

  if (useLive && loading && !checkIn && !initialCheckIn) {
    return (
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle="Loading check-in…" />
        <p className="text-sm text-zinc-500">Checking your session and programme week…</p>
      </PageContent>
    );
  }

  if (
    useLive &&
    !programmeLive &&
    !serverResolved &&
    !serverAuthConfirmed &&
    !hasLinkedAthlete
  ) {
    return (
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={headerSubtitle} />
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className="text-sm text-zinc-400">
            Sign in to view your weekly check-in.
          </p>
          {process.env.NODE_ENV === "development" && serverDebug?.reasonNotSignedIn ? (
            <p className="mt-2 text-[10px] font-mono text-zinc-600">
              {serverDebug.reasonNotSignedIn}
            </p>
          ) : null}
        </div>
      </PageContent>
    );
  }

  if (useLive && !programmeLive) {
    return (
      <PageContent width="wide">
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={headerSubtitle} />
        <div className={`${athleteCard} ${athleteCardPadding}`}>
          <p className="text-sm text-zinc-400">
            Your weekly check-in will appear here once your coach publishes your programme.
          </p>
        </div>
      </PageContent>
    );
  }

  return (
    <PageContent width="wide">
      <PageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={headerSubtitle}
        action={
          <StatusBadge
            tone={isCompleted ? "success" : needsCompleting ? "warn" : "neutral"}
          >
            {statusLabel}
          </StatusBadge>
        }
      />

      {mock ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          Preview mode — connect a live programme to save check-ins to your coach.
        </p>
      ) : null}

      {error ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            error.includes("Not signed in")
              ? "border-amber-500/30 bg-amber-950/20 text-amber-100"
              : "border-red-500/30 bg-red-950/20 text-red-200"
          }`}
        >
          {error === "Not signed in" && (serverAuthConfirmed || serverResolved)
            ? "Could not refresh check-in. Your session may need a page reload."
            : error}
        </p>
      ) : null}

      <div
        className={`${needsCompleting ? athleteCardHighlight : athleteCard} ${athleteCardPadding} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <p className="text-lg font-semibold text-white">Week {weekNumber} check-in</p>
          <p className="mt-1 text-sm text-zinc-500">
            {isCompleted && submittedAtLabel
              ? `Submitted on ${submittedAtLabel}`
              : isLocked
                ? activeCheckIn?.nextCheckInWeekNumber
                  ? `Your next check-in unlocks in Week ${activeCheckIn.nextCheckInWeekNumber}`
                  : "Available when this week's sessions are live"
                : "Complete before your coach plans your next week"}
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          Sessions{" "}
          <span className="font-bold text-yellow-400">
            {sessionsCompleted}/{sessionsPlanned}
          </span>{" "}
          ({completionPct}%)
        </p>
      </div>

      <section>
        <SectionTitle title="Rate this week" description="Scale 1–10 — takes about 2 minutes" />
        <div className="space-y-3">
          <RatingField
            icon={Moon}
            label="Sleep quality"
            value={form.sleep}
            onChange={(sleep) => setForm((f) => ({ ...f, sleep }))}
            disabled={!needsCompleting}
          />
          <RatingField
            icon={Zap}
            label="Energy levels"
            value={form.energy}
            onChange={(energy) => setForm((f) => ({ ...f, energy }))}
            accent="yellow"
            disabled={!needsCompleting}
          />
          <RatingField
            icon={Zap}
            label="Stress"
            value={form.stress}
            onChange={(stress) => setForm((f) => ({ ...f, stress }))}
            disabled={!needsCompleting}
          />
          <RatingField
            icon={Zap}
            label="Muscle soreness"
            value={form.soreness}
            onChange={(soreness) => setForm((f) => ({ ...f, soreness }))}
            accent="orange"
            hint="1 = no soreness, 10 = very sore"
            disabled={!needsCompleting}
          />
          <RatingField
            icon={Zap}
            label="Recovery"
            value={form.recovery}
            onChange={(recovery) => setForm((f) => ({ ...f, recovery }))}
            disabled={!needsCompleting}
          />
        </div>
      </section>

      <div className={`${athleteCard} ${athleteCardPadding}`}>
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-teal-400" />
          <span className="font-semibold text-white">Bodyweight</span>
        </div>
        <div className="flex items-center rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 focus-within:border-yellow-500/40">
          <input
            type="number"
            step="0.1"
            disabled={!needsCompleting}
            value={form.bodyweightKg ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bodyweightKg: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            className="w-full bg-transparent text-2xl font-bold text-white outline-none disabled:opacity-60"
          />
          <span className="text-sm text-zinc-500">kg</span>
        </div>
      </div>

      <section>
        <SectionTitle title="Reflection" description="Helps your coach adjust next week" />
        <TextArea
          label="Pain / niggles"
          value={form.painNiggles}
          onChange={(painNiggles) => setForm((f) => ({ ...f, painNiggles }))}
          disabled={!needsCompleting}
        />
        <TextArea
          label="Biggest win this week"
          value={form.biggestWin}
          onChange={(biggestWin) => setForm((f) => ({ ...f, biggestWin }))}
          disabled={!needsCompleting}
        />
        <TextArea
          label="Biggest struggle this week"
          value={form.biggestStruggle}
          onChange={(biggestStruggle) => setForm((f) => ({ ...f, biggestStruggle }))}
          disabled={!needsCompleting}
        />
        <TextArea
          label="Next week availability"
          value={form.nextWeekAvailability}
          onChange={(nextWeekAvailability) => setForm((f) => ({ ...f, nextWeekAvailability }))}
          disabled={!needsCompleting}
        />
      </section>

      {!useLive ? (
        <div className={`${athleteCard} ${athleteCardPadding} text-sm text-zinc-500`}>
          <p className="font-semibold text-zinc-300">Last check-in reference</p>
          <p className="mt-2 leading-relaxed">{MOCK_CHECK_IN.lastSummary.note}</p>
        </div>
      ) : null}

      {needsCompleting ? (
        <div className="sticky bottom-20 z-30 border-t border-zinc-800/80 bg-black/90 py-4 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:py-0 lg:backdrop-blur-none">
          <BtnPrimary
            disabled={saving || mock}
            onClick={() => void handleSubmit()}
            className="w-full sm:max-w-md"
          >
            {saving ? "Saving…" : "Submit weekly check-in"}
          </BtnPrimary>
        </div>
      ) : isCompleted ? (
        <p className="text-sm font-semibold text-emerald-400">
          Check-in completed{submittedAtLabel ? ` · ${submittedAtLabel}` : ""}
        </p>
      ) : null}
    </PageContent>
  );
}

function RatingField({
  icon: Icon,
  label,
  value,
  onChange,
  accent = "yellow",
  hint,
  disabled,
}: {
  icon: typeof Moon;
  label: string;
  value: number;
  onChange: (n: number) => void;
  accent?: "yellow" | "orange";
  hint?: string;
  disabled?: boolean;
}) {
  const valueColor = accent === "orange" ? "text-orange-400" : "text-yellow-400";
  const activeFill =
    accent === "orange"
      ? "border-orange-500/50 bg-orange-500/30 text-orange-200"
      : "border-yellow-400 bg-yellow-400 text-zinc-950";

  return (
    <div className={`${athleteCard} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${accent === "orange" ? "text-orange-400" : "text-purple-400"}`} />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className={`text-2xl font-bold tabular-nums ${valueColor}`}>{value}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              n === value
                ? activeFill
                : accent === "orange" && n <= value
                  ? "border-orange-500/30 bg-orange-950/40 text-orange-300/80"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-2 text-[11px] text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mt-4">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-yellow-500/40 disabled:opacity-60"
      />
    </div>
  );
}
