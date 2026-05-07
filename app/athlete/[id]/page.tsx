import { notFound } from "next/navigation";
import AthleteDashboardClient from "./AthleteDashboardClient";

export const dynamic = "force-dynamic";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

type AthletePageProps = {
  params: Promise<{ id: string }>;
};

async function getPlanById(planId: string) {
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
  const record: AirtableRecord | undefined = data.records?.[0];
  if (!record) return null;

  const rawPlanJson = record.fields["Generated Plan JSON"];
  if (!rawPlanJson) return null;

  let planJson: any = null;
  try {
    planJson = JSON.parse(rawPlanJson);
  } catch {
    return null;
  }

  return { record, planJson };
}

export default async function AthleteProfilePage({ params }: AthletePageProps) {
  const { id } = await params;
  const result = await getPlanById(id);
  if (!result) notFound();

  const { planJson } = result;
  const planId = String(planJson?.plan_id || id);

  return <AthleteDashboardClient planJson={planJson} planId={planId} />;
}
