"use client";

import { useState, useSyncExternalStore } from "react";
import type { StartGoalId } from "@/app/lib/start/startCopy";
import { StartGoalStep } from "./StartGoalStep";
import { StartHybridSupportStep } from "./StartHybridSupportStep";
import { StartLeadCapture } from "./StartLeadCapture";
import { StartSupportStep } from "./StartSupportStep";

const GOAL_KEY = "h365_start_v2_goal";
const LEAD_KEY = "h365_start_v2_lead";

function emptySubscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function readGoal(): StartGoalId | null {
  try {
    const value = sessionStorage.getItem(GOAL_KEY);
    return value === "hybrid" || value === "hyrox" ? value : null;
  } catch {
    return null;
  }
}

function writeGoal(id: StartGoalId) {
  try {
    sessionStorage.setItem(GOAL_KEY, id);
  } catch {
    /* private browsing */
  }
}

function readLeadComplete() {
  try {
    return sessionStorage.getItem(LEAD_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLeadComplete() {
  try {
    sessionStorage.setItem(LEAD_KEY, "1");
  } catch {
    /* private browsing */
  }
}

export function StartExperience() {
  const isClient = useIsClient();
  const [goalId, setGoalId] = useState<StartGoalId | null>(null);
  const [leadJustCompleted, setLeadJustCompleted] = useState(false);
  const [showGoal, setShowGoal] = useState(false);

  function selectGoal(id: StartGoalId) {
    writeGoal(id);
    setGoalId(id);
    setShowGoal(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLeadSuccess() {
    writeLeadComplete();
    setLeadJustCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleChangeGoal() {
    setShowGoal(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isClient) {
    return <section className="min-h-[calc(100dvh-52px)]" aria-hidden />;
  }

  const resolvedGoal = goalId ?? readGoal();
  const leadComplete = leadJustCompleted || readLeadComplete();

  if (!showGoal && resolvedGoal && leadComplete) {
    if (resolvedGoal === "hybrid") {
      return <StartHybridSupportStep onBack={handleChangeGoal} />;
    }
    return <StartSupportStep goalId={resolvedGoal} onBack={handleChangeGoal} />;
  }

  if (!showGoal && resolvedGoal && !leadComplete) {
    return (
      <StartLeadCapture
        goalId={resolvedGoal}
        onBack={handleChangeGoal}
        onSuccess={handleLeadSuccess}
      />
    );
  }

  return <StartGoalStep onSelect={selectGoal} />;
}
