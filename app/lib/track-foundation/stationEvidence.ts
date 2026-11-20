import type { EvidenceBook } from "./evidence";
import type { EquipmentId } from "./types";

/**
 * One station session can record several capacities because they are different
 * measurements inside the same visit, with rest between them.
 * It is not six maximal tests, and a race clock is not one of those measurements.
 *
 * Sled push and sled pull stay separate capacities, both recorded in that session.
 * Farmers and lunges share one loaded-carry check: either one tells us the athlete
 * can move a load. The other is not added as a second maximal test.
 */

export type StationEvidenceState = "KNOWN_RECENT" | "KNOWN_SUPPORTING" | "MISSING" | "ASSESSMENT_REQUIRED";

export type StationDomainReport = {
  id: string;
  label: string;
  state: StationEvidenceState;
  evidence: boolean;
  graph: boolean;
  graphId: string | null;
  reason: string;
};

type DomainSpec = {
  id: string;
  label: string;
  families: string[];
  splitKeys: string[];
  equipment: EquipmentId[];
  graphId: string | null;
  /** Bodyweight domains stay in the battery even with an empty kit. */
  always: boolean;
};

const DOMAINS: DomainSpec[] = [
  {
    id: "wall_ball",
    label: "Wall balls",
    families: ["wall_ball"],
    splitKeys: ["wall_balls", "wall_ball"],
    equipment: ["wall_ball"],
    graphId: "wall_ball_durability_a",
    always: false,
  },
  {
    id: "sled",
    label: "Sled",
    families: ["sled_push", "sled_pull"],
    splitKeys: ["sled_push", "sled_pull"],
    equipment: ["sled"],
    graphId: null,
    always: false,
  },
  {
    id: "loaded_locomotion",
    label: "Loaded carry",
    families: ["farmers", "lunges"],
    splitKeys: ["farmers", "sandbag_lunges", "lunges"],
    equipment: ["farmers", "sandbag", "dumbbells"],
    graphId: null,
    always: false,
  },
  {
    id: "bbj",
    label: "Burpee broad jump",
    families: ["bbj"],
    splitKeys: ["burpee_broad_jump", "bbj"],
    equipment: [],
    graphId: null,
    always: true,
  },
];

function required(spec: DomainSpec, equipment: EquipmentId[]): boolean {
  if (spec.always) return true;
  return spec.equipment.some((item) => equipment.includes(item));
}

function splitValue(book: EvidenceBook, keys: string[]): { value: string; recent: boolean } | null {
  const rows = [book.hyrox.current, book.hyrox.held].filter((row) => row);
  for (const row of rows) {
    const splits = row?.details?.splits ?? null;
    if (!splits) continue;
    for (const key of keys) {
      const value = splits[key];
      if (typeof value === "string" && value.trim()) {
        const recent = row?.disposition === "CURRENT_ANCHOR";
        return { value: value.trim(), recent };
      }
    }
  }
  return null;
}

function familyState(book: EvidenceBook, families: string[]): "recent" | "supporting" | null {
  let supporting = false;
  for (const familyId of families) {
    const family = book.stations[familyId];
    if (!family) continue;
    if (family.anchorStatus === "active") return "recent";
    if (family.anchorStatus === "reassessment_due") supporting = true;
  }
  return supporting ? "supporting" : null;
}

/**
 * Overall race time is ignored. A split counts only when that station's value is present.
 * Sled is known only when both push and pull are known. A single sled split is not the whole domain.
 */
export function resolveStationDomains(book: EvidenceBook, equipment: EquipmentId[]): StationDomainReport[] {
  return DOMAINS.filter((spec) => required(spec, equipment)).map((spec) => {
    const fromFamily = familyState(book, spec.families);
    const split = spec.id === "sled" ? sledSplit(book) : splitValue(book, spec.splitKeys);
    let state: StationEvidenceState = "MISSING";
    let reason = "No structured result for this station.";
    if (fromFamily === "recent") {
      state = "KNOWN_RECENT";
      reason = "A structured station result is inside the current window.";
    } else if (fromFamily === "supporting") {
      state = "KNOWN_SUPPORTING";
      reason = "An older structured result is still on file. It is not a current anchor.";
    } else if (split?.recent) {
      state = "KNOWN_RECENT";
      reason = "The race file includes this station split. The overall time was not used.";
    } else if (split) {
      state = "KNOWN_SUPPORTING";
      reason = "An older race file includes this station split.";
    } else {
      state = "ASSESSMENT_REQUIRED";
      reason = "This station is not known. A race time does not stand in for it.";
    }
    return {
      id: spec.id,
      label: spec.label,
      state,
      evidence: state === "KNOWN_RECENT" || state === "KNOWN_SUPPORTING",
      graph: spec.graphId != null,
      graphId: spec.graphId,
      reason,
    };
  });
}

function sledSplit(book: EvidenceBook): { value: string; recent: boolean } | null {
  const push = splitValue(book, ["sled_push"]);
  const pull = splitValue(book, ["sled_pull"]);
  if (!push || !pull) return null;
  return { value: `${push.value} / ${pull.value}`, recent: push.recent && pull.recent };
}

export function stationAssessmentRequired(domains: StationDomainReport[]): boolean {
  return domains.some((domain) => domain.state === "ASSESSMENT_REQUIRED" || domain.state === "MISSING");
}

export function stationRequirementReason(domains: StationDomainReport[]): string {
  const open = domains.filter((domain) => !domain.evidence);
  if (open.length === 0) {
    return "Station results are on file for the stations this plan uses. A race time was not used in their place.";
  }
  const names = open.map((domain) => domain.label.toLowerCase()).join(", ");
  return `Still missing: ${names}. One station session records those, with rest between them. The overall race time is not used.`;
}
