export type GenerateProgrammeSuccess = {
  ok: true;
  programmeInstanceId: string;
  weeksGenerated: number;
  unlockedWeeks: number[];
  message?: string;
  unlockAt?: string | null;
  status?: "pending_unlock" | "live";
};

export type GenerateProgrammeFailure = {
  ok: false;
  error: string;
};

export type GenerateProgrammeResponse = GenerateProgrammeSuccess | GenerateProgrammeFailure;

export async function postDashboardGenerateProgramme(): Promise<GenerateProgrammeResponse> {
  const res = await fetch("/api/dashboard/generate-programme", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });

  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    const err =
      typeof payload.error === "string"
        ? payload.error
        : "Unable to generate programme. Please try again.";
    return { ok: false, error: err };
  }

  if (payload.ok !== true || typeof payload.programmeInstanceId !== "string") {
    return { ok: false, error: "Unexpected response from server." };
  }

  return {
    ok: true,
    programmeInstanceId: payload.programmeInstanceId as string,
    weeksGenerated:
      typeof payload.weeksGenerated === "number"
        ? (payload.weeksGenerated as number)
        : 12,
    unlockedWeeks: Array.isArray(payload.unlockedWeeks)
      ? (payload.unlockedWeeks as unknown[]).map((x) => Number(x)).filter(Number.isFinite)
      : [1, 2, 3, 4],
    message:
      typeof payload.message === "string" ? (payload.message as string) : undefined,
    unlockAt:
      typeof payload.unlockAt === "string"
        ? (payload.unlockAt as string)
        : payload.unlockAt === null
          ? null
          : undefined,
    status:
      payload.status === "pending_unlock" || payload.status === "live"
        ? payload.status
        : undefined,
  };
}
