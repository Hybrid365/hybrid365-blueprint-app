import { headers } from "next/headers";
import {
  uxLabFromQueryString,
  uxLabFromSearchParams,
} from "@/app/lib/dev/community-athlete-lab/previewEntry";

/** Prefer Next searchParams; fall back to forwarded URL headers if a proxy keeps the query off searchParams. */
export async function readUxLabFromRequest(
  params: Record<string, string | string[] | undefined>
): Promise<string | undefined> {
  const fromParams = uxLabFromSearchParams(params);
  if (fromParams) return fromParams;

  const headerList = await headers();
  const headerCandidates = [
    headerList.get("x-forwarded-uri"),
    headerList.get("x-invoke-query"),
    headerList.get("x-url"),
    headerList.get("next-url"),
  ];
  for (const raw of headerCandidates) {
    const value = uxLabFromQueryString(raw);
    if (value) return value;
  }
  return undefined;
}
