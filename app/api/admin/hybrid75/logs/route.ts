import { NextResponse } from "next/server";
import { validateHybrid75AdminRequest } from "@/app/lib/hybrid75AdminAuth";
import {
  fetchAllChallengeLogs,
  isChallengeLoggingConfigured,
} from "@/app/lib/hybrid75ChallengeLogServer";

export async function GET(request: Request) {
  const authError = validateHybrid75AdminRequest(request);
  if (authError) return authError;

  if (!isChallengeLoggingConfigured()) {
    return NextResponse.json({ error: "Challenge logging is not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status")?.trim() ?? "pending";
  const status =
    statusParam === "approved" || statusParam === "rejected" || statusParam === "all"
      ? statusParam
      : "pending";

  try {
    const logs = await fetchAllChallengeLogs(status);
    return NextResponse.json({ logs, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
