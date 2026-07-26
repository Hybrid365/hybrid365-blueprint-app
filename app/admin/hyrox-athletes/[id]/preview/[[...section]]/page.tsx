import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CoachAthletePreviewClient, {
  type PreviewSection,
} from "@/components/admin-hyrox-athletes/CoachAthletePreviewClient";
import { assertHyroxCoachAccess } from "@/app/lib/hyroxAccess";
import {
  HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE,
  HYROX_ADMIN_PREVIEW_FALLBACK_TIMEZONE,
  previewPathForAthlete,
  verifyHyroxAdminAthletePreviewToken,
} from "@/app/lib/hyroxAdminAthletePreview";
import { recordHyroxAdminPreviewAudit } from "@/app/lib/hyroxAdminPreviewAudit";
import { fetchHyroxAthleteById } from "@/app/lib/hyroxAthleteCoachDb";
import {
  buildAthleteCheckInSummary,
  buildAthleteWeeklyCheckInForProgramme,
} from "@/app/lib/hyroxAthleteCheckInServer";
import { fetchAthleteLiveProgrammeForServer } from "@/app/lib/hyroxAthleteProgrammeServer";
import { fetchAthleteProgressFlags } from "@/app/lib/hyroxAthleteServer";
import { createCoachServerClient } from "@/app/lib/hyroxCoachSupabase";
import { isHyroxPerformanceHubEnabled } from "@/app/lib/hyrox-team/modules/performanceHub/featureFlag";
import { isHyroxTodayV2Enabled } from "@/app/lib/hyrox-team/modules/today/featureFlag";
import {
  fetchDailyReadinessForDate,
  localDateYmdInTimeZone,
} from "@/app/lib/hyrox-team/modules/today/dailyReadinessServer";
import { fetchAthletePublishedProgramme } from "@/app/lib/hyroxProgrammeServer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Preview Athlete Experience | Hybrid365 Coach",
};

type PreviewPageProps = {
  params: Promise<{ id: string; section?: string[] }>;
};

const ALLOWED_SECTIONS = new Set<string>([
  "",
  "programme",
  "progress",
  "check-in",
  "performance-testing",
  "benchmarks",
  "coach-notes",
  "race-prep",
  "resources",
  "testing",
]);

function parseSection(parts: string[] | undefined): PreviewSection {
  const raw = parts?.[0] ?? "";
  if (!ALLOWED_SECTIONS.has(raw)) return "";
  return raw as PreviewSection;
}

export default async function HyroxAthletePreviewPage({ params }: PreviewPageProps) {
  const coach = await assertHyroxCoachAccess();
  const { id, section: sectionParts } = await params;
  const section = parseSection(sectionParts);

  const { client: supabase } = await createCoachServerClient();
  const { athlete, error } = await fetchHyroxAthleteById(supabase, id);

  if (error) {
    throw new Error(error);
  }
  if (!athlete) {
    notFound();
  }

  const jar = await cookies();
  const existing = verifyHyroxAdminAthletePreviewToken(
    jar.get(HYROX_ADMIN_ATHLETE_PREVIEW_COOKIE)?.value
  );

  if (!existing.ok) {
    const qs = section ? `?section=${encodeURIComponent(section)}` : "";
    redirect(`/admin/hyrox-athletes/${athlete.id}/preview/start${qs}`);
  }

  // URL athlete ID / coach tampering
  if (
    existing.payload.athleteId !== athlete.id ||
    existing.payload.coachUserId !== coach.userId
  ) {
    redirect(`/admin/hyrox-athletes/${athlete.id}/preview/exit`);
  }

  await recordHyroxAdminPreviewAudit(supabase, {
    coachUserId: coach.userId,
    athleteId: athlete.id,
    event: "preview_page_view",
    route: previewPathForAthlete(athlete.id, section),
  });

  const programme = await fetchAthleteLiveProgrammeForServer(athlete);

  let athleteTimezone = HYROX_ADMIN_PREVIEW_FALLBACK_TIMEZONE;
  const localDate = localDateYmdInTimeZone(new Date(), athleteTimezone);
  const readinessToday = await fetchDailyReadinessForDate(supabase, athlete.id, localDate);
  if (readinessToday?.timezone?.trim()) {
    athleteTimezone = readinessToday.timezone.trim();
  }

  let checkIn = null;
  let checkInSummary = programme?.weeklyCheckIn ?? null;
  if (section === "check-in" && programme?.published) {
    try {
      const flags = await fetchAthleteProgressFlags(supabase, athlete.id);
      const published = await fetchAthletePublishedProgramme(supabase, athlete, flags);
      checkIn = await buildAthleteWeeklyCheckInForProgramme(supabase, athlete, published);
      checkInSummary = buildAthleteCheckInSummary(checkIn);
    } catch {
      checkIn = null;
    }
  }

  return (
    <CoachAthletePreviewClient
      athlete={athlete}
      programme={programme}
      section={section}
      todayV2Enabled={isHyroxTodayV2Enabled(athlete)}
      performanceHubEnabled={isHyroxPerformanceHubEnabled(athlete)}
      athleteTimezone={athleteTimezone}
      initialCheckIn={checkIn}
      initialCheckInSummary={checkInSummary}
      initialReadiness={readinessToday}
    />
  );
}
