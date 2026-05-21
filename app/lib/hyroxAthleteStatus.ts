import type {
  HyroxAthletePaymentStatus,
  HyroxAthleteRow,
  HyroxAthleteStatus,
} from "@/app/lib/hyroxDatabaseTypes";

export type HyroxAthleteProgressInput = {
  payment_status: HyroxAthletePaymentStatus;
  user_id: string | null;
  status: HyroxAthleteStatus;
  hasAssessment?: boolean;
  hasTesting?: boolean;
};

/** Suggested athlete.status after payment link / submissions (no auto-publish). */
export function getNextHyroxAthleteStatus(input: HyroxAthleteProgressInput): HyroxAthleteStatus {
  const hasAssessment = Boolean(input.hasAssessment);
  const hasTesting = Boolean(input.hasTesting);
  const paid = input.payment_status === "paid";

  if (!paid) {
    if (input.status === "accepted" || input.payment_status === "pending") {
      return "accepted";
    }
    return input.status;
  }

  if (!input.user_id) {
    return "payment_confirmed";
  }

  if (!hasAssessment) {
    return "assessment_required";
  }

  if (!hasTesting) {
    return "testing_required";
  }

  if (
    input.status === "coach_reviewing" ||
    input.status === "draft_generated" ||
    input.status === "programme_published"
  ) {
    return input.status;
  }

  return "coach_reviewing";
}

export function suggestedNextAthleteCoachAction(
  athlete: Pick<
    HyroxAthleteRow,
    "status" | "payment_status" | "user_id"
  > & { hasAssessment?: boolean; hasTesting?: boolean }
): string {
  if (athlete.payment_status === "pending") {
    return "Mark payment confirmed";
  }
  if (athlete.payment_status === "paid" && !athlete.user_id) {
    return "Link athlete account";
  }
  if (athlete.user_id && athlete.status === "assessment_required") {
    return "Send onboarding / assessment link";
  }
  if (athlete.status === "assessment_submitted" || athlete.status === "coach_reviewing") {
    return "Review profile";
  }
  if (athlete.status === "testing_required") {
    return "Await testing submission";
  }
  if (athlete.status === "testing_submitted") {
    return "Review testing & map profile";
  }
  if (athlete.status === "draft_generated") {
    return "Review programme draft";
  }
  if (athlete.status === "programme_published") {
    return "Monitor check-ins / programme";
  }
  return "Review athlete";
}
