"use server";

import { revalidatePath } from "next/cache";
import type { BenchmarkResultInput, TrackIntake } from "@/app/lib/track-foundation/types";
import {
  activateProgramme,
  addEvidence,
  advanceClock,
  acceptNextWeek,
  chooseAccept,
  chooseOriginal,
  completeAssessment,
  completeTraining,
  createAssessmentWeek,
  saveCheckIn,
  saveMorning,
  saveOnboarding,
  saveStationBattery,
} from "@/app/lib/track-canary/model";

function refresh() {
  revalidatePath("/track");
  revalidatePath("/track/admin");
}

export async function saveOnboardingAction(intake: TrackIntake) {
  await saveOnboarding(intake);
  refresh();
}

export async function addEvidenceAction(input: { testId: string; resultValue: string; date: string; source: BenchmarkResultInput["source"] }) {
  await addEvidence(input);
  refresh();
}

export async function createAssessmentAction() {
  await createAssessmentWeek();
  refresh();
}

export async function completeAssessmentAction(input: { sessionId: string; resultValue: string; rpe: number }) {
  await completeAssessment(input);
  refresh();
}

export async function activateProgrammeAction() {
  await activateProgramme();
  refresh();
}

export async function saveMorningAction(input: { sleep: number; energy: number; recovery: number; soreness: number; readiness: number; pain: boolean }) {
  await saveMorning(input);
  refresh();
}

export async function acceptAction() {
  await chooseAccept();
  refresh();
}

export async function keepAction() {
  await chooseOriginal();
  refresh();
}

export async function completeTrainingAction(input: { sessionId: string; completion: string; rpe: number; feel: string; pain: boolean; actuals: Record<string, string | number> }) {
  await completeTraining(input);
  refresh();
}

export async function saveCheckInAction(answers: Record<string, string | number | boolean>) {
  await saveCheckIn(answers);
  refresh();
}

export async function advanceClockAction() {
  await advanceClock();
  refresh();
}

export async function acceptNextWeekAction(choice: "recommended" | "keep") {
  await acceptNextWeek(choice);
  refresh();
}

export async function saveStationBatteryAction(input: {
  wallBallReps: string;
  sledPushMetres: string;
  sledPullMetres: string;
  farmersMetres: string;
  bbjMetres: string;
}) {
  await saveStationBattery(input);
  refresh();
}
