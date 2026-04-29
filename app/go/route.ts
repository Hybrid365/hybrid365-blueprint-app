import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getLatestPlanIdByEmail(email: string) {
  const token = process.env.AIRTABLE_TOKEN!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableName = process.env.AIRTABLE_TABLE_NAME!;

  const safeEmail = email.replace(/'/g, "\\'");
  const filterFormula = encodeURIComponent(`{Email}='${safeEmail}'`);

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?filterByFormula=${filterFormula}&sort%5B0%5D%5Bfield%5D=Created&sort%5B0%5D%5Bdirection%5D=desc&maxRecords=1`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Airtable lookup error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const record = data.records?.[0];

  if (!record) return null;

  return record.fields["Plan ID"] || null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const planId = await getLatestPlanIdByEmail(email);

  if (!planId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.redirect(new URL(`/plan/${planId}`, req.url));
}