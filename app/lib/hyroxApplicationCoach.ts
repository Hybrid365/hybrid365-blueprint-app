import type { HyroxApplicationStatus } from "@/app/lib/hyroxDatabaseTypes";

export function suggestedNextApplicationAction(status: HyroxApplicationStatus): string {
  switch (status) {
    case "submitted":
      return "Review application";
    case "under_review":
      return "Accept or reject";
    case "accepted":
      return "Send payment link";
    case "rejected":
      return "Archived — no action";
    default:
      return "Review";
  }
}

export function formatApplicationDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const APPLICATION_STATUS_LABELS: Record<HyroxApplicationStatus, string> = {
  submitted: "Submitted",
  under_review: "Under review",
  accepted: "Accepted",
  rejected: "Rejected",
};
