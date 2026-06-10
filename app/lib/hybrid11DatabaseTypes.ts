export type Hybrid11Json = Record<string, string | number | boolean | null>;

export type Hybrid11ApplicationStatus =
  | "new"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "converted";

export type Hybrid11ApplicationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  age: number | null;
  location: string | null;
  occupation: string | null;
  application_type: "hybrid_1_1";
  track: "hybrid_performance";
  status: Hybrid11ApplicationStatus;
  main_goal: string | null;
  body_composition_goal: string | null;
  performance_goal: string | null;
  target_outcome: string | null;
  reason_for_applying: string | null;
  training_background: Hybrid11Json;
  benchmarks: Hybrid11Json;
  availability: Hybrid11Json;
  nutrition_lifestyle: Hybrid11Json;
  injuries_limitations: Hybrid11Json;
  coaching_fit: Hybrid11Json;
  consent: Hybrid11Json;
  raw_payload: Hybrid11Json;
  coach_notes: string | null;
};

export type Hybrid11ApplicationInsert = Omit<
  Hybrid11ApplicationRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export const HYBRID11_APPLICATION_STATUSES: Hybrid11ApplicationStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
  "converted",
];

export const HYBRID11_STATUS_LABELS: Record<Hybrid11ApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
  converted: "Converted",
};

export const HYBRID11_APPLICATION_TYPE_LABEL = "Hybrid 1-1";
export const HYBRID11_TRACK_LABEL = "Hybrid Performance";
