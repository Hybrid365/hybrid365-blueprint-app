import { normalizeChallengeMode, type Hybrid75PlanMeta, type HyroxFreeWeekMeta } from "./freeWeekChallengeMode";

export type FreePlanRecord = {
  planJson: Record<string, unknown>;
  planId: string;
  isHybrid75: boolean;
  isHyrox: boolean;
  hybrid75Meta: Hybrid75PlanMeta | null;
  hyroxMeta: HyroxFreeWeekMeta | null;
};

export async function getFreePlanById(planId: string): Promise<FreePlanRecord | null> {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const filterFormula = encodeURIComponent(`{Plan ID}='${planId}'`);
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?filterByFormula=${filterFormula}&maxRecords=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airtable fetch error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const record = data.records?.[0];
  if (!record) return null;

  const rawPlanJson = record.fields["Generated Plan JSON"];
  if (!rawPlanJson) return null;

  let planJson: Record<string, unknown> | null = null;
  try {
    planJson = JSON.parse(rawPlanJson);
  } catch {
    return null;
  }

  if (!planJson) return null;

  const challengeMode = normalizeChallengeMode(planJson.challenge_mode);
  const isHybrid75 = challengeMode === "hybrid75";
  const isHyrox = challengeMode === "hyrox";
  const resolvedPlanId = String(planJson.plan_id || planId);
  const hybrid75Meta: Hybrid75PlanMeta | null = isHybrid75
    ? ((planJson.hybrid75 as Hybrid75PlanMeta | undefined) ?? null)
    : null;
  const hyroxMeta: HyroxFreeWeekMeta | null = isHyrox
    ? ((planJson.hyrox as HyroxFreeWeekMeta | undefined) ?? null)
    : null;

  return { planJson, planId: resolvedPlanId, isHybrid75, isHyrox, hybrid75Meta, hyroxMeta };
}
