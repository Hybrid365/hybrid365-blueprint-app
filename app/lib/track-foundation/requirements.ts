import type { EvidenceBook } from "./evidence";
import { resolveStationDomains, stationAssessmentRequired, stationRequirementReason } from "./stationEvidence";
import { athleteHasEquipment, getTest } from "./testLibrary";
import type { AssessmentRequirement, TrackGoal, TrackIntake } from "./types";

function has(equipment: TrackIntake["equipment"], id: TrackIntake["equipment"][number]): boolean {
  return equipment.includes(id);
}

function runningDepth(book: EvidenceBook): "full" | "grace" | "aerobic_only" | "none" {
  const status = book.running.anchorStatus;
  const rows = book.running.contenders;
  const pace = rows.some((row) =>
    ["run_5k", "run_10k", "run_threshold", "run_lab_threshold"].includes(row.testId)
  );
  if (pace && status === "active") return "full";
  if (pace && status === "reassessment_due") return "grace";
  if (rows.some((row) => row.testId === "run_half")) return "aerobic_only";
  return "none";
}

function push(list: AssessmentRequirement[], item: AssessmentRequirement) {
  list.push(item);
}

function satisfied(
  id: string,
  testId: string | null,
  label: string,
  priority: AssessmentRequirement["priority"],
  reason: string,
  resultId: string | null
): AssessmentRequirement {
  return { id, testId, label, priority, status: "satisfied", reason, satisfiedByResultId: resultId };
}

/**
 * Minimum sufficient evidence for the goal.
 * A valid recent result satisfies its test. Bike is not required for HYROX or running.
 * Strength and extra stations are supporting, not a reason to block the first week.
 */
export function resolveAssessmentRequirements(intake: TrackIntake, book: EvidenceBook): AssessmentRequirement[] {
  const goal: TrackGoal | null = intake.goal;
  const reqs: AssessmentRequirement[] = [];
  const manual = intake.pain.severity === "meaningful_unresolved";

  if (!goal) {
    push(reqs, {
      id: "goal",
      testId: null,
      label: "Primary goal",
      priority: "critical",
      status: "test_required",
      reason: "Programming needs a goal before any test is chosen.",
      satisfiedByResultId: null,
    });
    return reqs;
  }

  if (manual) {
    push(reqs, {
      id: "pain_review",
      testId: null,
      label: "Coach review",
      priority: "critical",
      status: "manual_review",
      reason: "Unresolved pain needs a person to review it before maximal testing or automated programming.",
      satisfiedByResultId: null,
    });
  }

  const depth = runningDepth(book);
  const runResult = book.running.current ?? book.running.held;
  if (depth === "full") {
    push(
      reqs,
      satisfied(
        "running",
        "run_5k",
        "Running",
        "critical",
        `Recent ${runResult?.testId === "run_10k" ? "10K" : runResult?.testId === "run_5k" ? "5K" : "running"} result accepted. The same test is not repeated.`,
        runResult?.id ?? null
      )
    );
  } else if (depth === "grace") {
    push(reqs, {
      id: "running",
      testId: "run_5k",
      label: "Running",
      priority: "supporting",
      status: "reassessment_due",
      reason: "The previous running result is still held so training is not broken. A reassessment is due.",
      satisfiedByResultId: runResult?.id ?? null,
    });
  } else if (depth === "aerobic_only") {
    push(reqs, {
      id: "running",
      testId: "run_5k",
      label: "5K",
      priority: "critical",
      status: manual ? "manual_review" : "test_required",
      reason: "The half marathon is an aerobic reference only. Threshold and speed are not invented from it.",
      satisfiedByResultId: runResult?.id ?? null,
    });
  } else {
    push(reqs, {
      id: "running",
      testId: "run_5k",
      label: "5K",
      priority: "critical",
      status: manual ? "manual_review" : "test_required",
      reason: book.running.supporting.some((row) => row.source === "watch_estimate")
        ? "A watch estimate is on file. It does not replace a 5K test."
        : book.running.historical.length > 0
          ? "The older running result stays in history. It is not the current anchor."
          : "No usable running result yet.",
      satisfiedByResultId: null,
    });
  }

  const wantsHyrox = goal === "hyrox";
  const wantsHybrid = goal === "hybrid_performance";
  const wantsRun = goal === "running_performance";

  if (wantsHyrox || wantsHybrid) {
    const skiTest = getTest("ski_2k")!;
    const rowTest = getTest("row_2k")!;
    const skiGear = athleteHasEquipment(intake.equipment, skiTest);
    const rowGear = athleteHasEquipment(intake.equipment, rowTest);
    if (skiGear) {
      if (book.ski.anchorStatus === "active") {
        push(reqs, satisfied("ski", "ski_2k", "SkiErg", "critical", "Recent SkiErg result accepted.", book.ski.current?.id ?? null));
      } else if (book.ski.anchorStatus === "reassessment_due") {
        push(reqs, {
          id: "ski",
          testId: "ski_2k",
          label: "SkiErg",
          priority: "supporting",
          status: "reassessment_due",
          reason: "Ski result is held and reassessment is due.",
          satisfiedByResultId: book.ski.held?.id ?? null,
        });
      } else {
        push(reqs, {
          id: "ski",
          testId: "ski_2k",
          label: "SkiErg",
          priority: "supporting",
          status: manual ? "manual_review" : "test_required",
          reason: "SkiErg is part of this goal and the anchor is missing. Running can start conservatively without it.",
          satisfiedByResultId: null,
        });
      }
    } else if (rowGear) {
      push(reqs, ergRowRequirement(book, manual, "supporting"));
    } else if (intake.equipmentConfirmed) {
      push(reqs, {
        id: "ski",
        testId: "ski_2k",
        label: "SkiErg",
        priority: "supporting",
        status: "equipment_blocked",
        reason: "No SkiErg or RowErg access. Erg tests are not prescribed, and erg targets stay unset.",
        satisfiedByResultId: null,
      });
    }

    if (skiGear && rowGear) {
      if (book.row.anchorStatus === "active") {
        push(reqs, satisfied("row", "row_2k", "RowErg", "supporting", "Recent RowErg result accepted.", book.row.current?.id ?? null));
      } else if (book.row.anchorStatus === "reassessment_due") {
        push(reqs, {
          id: "row",
          testId: "row_2k",
          label: "RowErg",
          priority: "supporting",
          status: "reassessment_due",
          reason: "Row result is held and reassessment is due.",
          satisfiedByResultId: book.row.held?.id ?? null,
        });
      } else {
        push(reqs, {
          id: "row",
          testId: "row_2k",
          label: "RowErg",
          priority: "supporting",
          status: manual ? "manual_review" : "test_required",
          reason: "RowErg is available and still unmeasured. Ski remains the critical erg.",
          satisfiedByResultId: null,
        });
      }
    }
  }

  if (wantsHybrid && (has(intake.equipment, "bike") || has(intake.equipment, "assault_bike"))) {
    if (book.bike.anchorStatus === "active") {
      push(reqs, satisfied("bike", "bike_20min", "Bike", "supporting", "Recent bike anchor accepted.", book.bike.current?.id ?? null));
    } else if (book.bike.anchorStatus === "reassessment_due") {
      push(reqs, {
        id: "bike",
        testId: "bike_20min",
        label: "Bike",
        priority: "supporting",
        status: "reassessment_due",
        reason: "Bike anchor is held and reassessment is due.",
        satisfiedByResultId: book.bike.held?.id ?? null,
      });
    } else {
      push(reqs, {
        id: "bike",
        testId: "bike_20min",
        label: "Bike",
        priority: "supporting",
        status: manual ? "manual_review" : "test_required",
        reason: "Hybrid training on a bike needs an FTP anchor. It is not required for HYROX-only.",
        satisfiedByResultId: null,
      });
    }
  } else if (wantsHyrox || wantsRun) {
    push(reqs, {
      id: "bike",
      testId: "bike_20min",
      label: "Bike",
      priority: "supporting",
      status: "skipped_not_needed",
      reason: "Bike testing is not required for this goal.",
      satisfiedByResultId: null,
    });
  }

  const strengthGear = has(intake.equipment, "gym") || has(intake.equipment, "dumbbells");
  if ((wantsHyrox || wantsHybrid || wantsRun) && strengthGear) {
    if (book.strength.anchorStatus === "active") {
      push(reqs, satisfied("strength", "strength_lower", "Strength", "supporting", "Recent strength result accepted.", book.strength.current?.id ?? null));
    } else if (!manual) {
      push(reqs, {
        id: "strength",
        testId: "strength_lower",
        label: "Strength",
        priority: "supporting",
        status: book.strength.anchorStatus === "reassessment_due" ? "reassessment_due" : "test_required",
        reason:
          book.strength.anchorStatus === "reassessment_due"
            ? "Strength result is held and reassessment is due."
            : "A controlled strength check is useful. It is not a reason to delay the first conservative week once running is known.",
        satisfiedByResultId: book.strength.held?.id ?? null,
      });
    }
  } else if (!strengthGear && intake.equipmentConfirmed) {
    push(reqs, {
      id: "strength",
      testId: "strength_lower",
      label: "Strength",
      priority: "supporting",
      status: "equipment_blocked",
      reason: "No gym or dumbbells, so a loaded strength test is not prescribed.",
      satisfiedByResultId: null,
    });
  }

  if (wantsHyrox) {
    const raceKnown = book.hyrox.anchorStatus === "active" || book.hyrox.anchorStatus === "reassessment_due";
    if (raceKnown) {
      push(
        reqs,
        satisfied(
          "hyrox",
          "hyrox_race",
          "HYROX",
          "supporting",
          "Recent HYROX result accepted. Missing splits do not force a repeat race.",
          (book.hyrox.current ?? book.hyrox.held)?.id ?? null
        )
      );
    }
    const domains = resolveStationDomains(book, intake.equipment);
    const stationsKnown = !stationAssessmentRequired(domains);
    if (stationsKnown) {
      push(reqs, {
        id: "stations",
        testId: "hyrox_station_battery",
        label: "Stations",
        priority: "supporting",
        status: "satisfied",
        reason: stationRequirementReason(domains),
        satisfiedByResultId: null,
      });
    } else if (!manual) {
      push(reqs, {
        id: "stations",
        testId: "hyrox_station_battery",
        label: "Stations",
        priority: "supporting",
        status: "test_required",
        reason: stationRequirementReason(domains),
        satisfiedByResultId: null,
      });
    }
  }

  if (!intake.equipmentConfirmed) {
    push(reqs, {
      id: "equipment",
      testId: null,
      label: "Equipment",
      priority: "critical",
      status: "test_required",
      reason: "Equipment access is still unknown, so tests cannot be chosen safely.",
      satisfiedByResultId: null,
    });
  } else {
    push(reqs, satisfied("equipment", null, "Equipment", "critical", "Equipment access is known.", null));
  }

  const daysKnown =
    intake.availability.sessionLength != null &&
    ((intake.availability.daysPerWeek ?? 0) > 0 || intake.availability.availableDays.length > 0);
  if (!daysKnown) {
    push(reqs, {
      id: "availability",
      testId: null,
      label: "Availability",
      priority: "critical",
      status: "test_required",
      reason: "Training days and session length are required before a week is built.",
      satisfiedByResultId: null,
    });
  } else {
    push(reqs, satisfied("availability", null, "Availability", "critical", "Weekly availability is known.", null));
  }

  return reqs;
}

function ergRowRequirement(book: EvidenceBook, manual: boolean, priority: AssessmentRequirement["priority"]): AssessmentRequirement {
  if (book.row.anchorStatus === "active") {
    return satisfied("row", "row_2k", "RowErg", priority, "Recent RowErg result accepted.", book.row.current?.id ?? null);
  }
  if (book.row.anchorStatus === "reassessment_due") {
    return {
      id: "row",
      testId: "row_2k",
      label: "RowErg",
      priority: "supporting",
      status: "reassessment_due",
      reason: "Row result is held and reassessment is due.",
      satisfiedByResultId: book.row.held?.id ?? null,
    };
  }
  return {
    id: "row",
    testId: "row_2k",
    label: "RowErg",
    priority,
    status: manual ? "manual_review" : "test_required",
    reason: "No SkiErg access. RowErg is the erg anchor for this athlete.",
    satisfiedByResultId: null,
  };
}

export function programmingReadinessFrom(
  intake: TrackIntake,
  reqs: AssessmentRequirement[]
): { state: import("./types").ProgrammingReadiness; reasons: string[] } {
  const reasons: string[] = [];
  if (intake.pain.severity === "meaningful_unresolved") {
    return {
      state: "NOT_READY",
      reasons: ["Unresolved pain needs manual review before a programme is proposed."],
    };
  }
  if (!intake.goal) {
    return { state: "NOT_READY", reasons: ["Goal is missing."] };
  }
  const criticalOpen = reqs.filter(
    (req) =>
      req.priority === "critical" &&
      (req.status === "test_required" || req.status === "manual_review")
  );
  const supportingOpen = reqs.filter(
    (req) =>
      (req.status === "test_required" || req.status === "reassessment_due") &&
      req.priority === "supporting"
  );
  if (criticalOpen.length > 0) {
    return {
      state: "NOT_READY",
      reasons: criticalOpen.map((req) => req.reason),
    };
  }
  if (supportingOpen.length > 0) {
    reasons.push("Required anchors are in place. Non-critical checks can finish while a conservative week is prepared.");
    reasons.push(...supportingOpen.map((req) => req.reason));
    return { state: "PARTIALLY_READY", reasons };
  }
  reasons.push("Required anchors for this goal are in place.");
  return { state: "READY", reasons };
}
