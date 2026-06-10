import {
  HYBRID11_STATUS_LABELS,
  type Hybrid11ApplicationStatus,
} from "@/app/lib/hybrid11DatabaseTypes";

export function formatHybrid11ApplicationDate(iso: string): string {
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

export function hybrid11StatusLabel(status: Hybrid11ApplicationStatus): string {
  return HYBRID11_STATUS_LABELS[status] ?? status;
}

export function suggestedHybrid11NextAction(status: Hybrid11ApplicationStatus): string {
  switch (status) {
    case "new":
      return "Review application";
    case "reviewing":
      return "Accept or reject";
    case "accepted":
      return "Send payment/onboarding manually for now.";
    case "rejected":
      return "Closed";
    case "converted":
      return "Client onboarded";
    default:
      return "";
  }
}

export function trainingDaysFromApplication(app: {
  training_background?: Record<string, unknown> | null;
}): string {
  const days = app.training_background?.current_weekly_training_days;
  return typeof days === "string" && days.trim() ? days : "—";
}

export function experienceSummary(app: {
  training_background?: Record<string, unknown> | null;
}): string {
  const parts: string[] = [];
  const bg = app.training_background ?? {};
  if (typeof bg.training_age === "string" && bg.training_age.trim()) {
    parts.push(`Training age: ${bg.training_age}`);
  }
  if (typeof bg.gym_strength_experience === "string" && bg.gym_strength_experience.trim()) {
    parts.push(bg.gym_strength_experience);
  }
  return parts.length ? parts.join(" · ") : "—";
}
