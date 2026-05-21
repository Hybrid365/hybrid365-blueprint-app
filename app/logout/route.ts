import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getRequestOrigin, sanitizeAuthNextPath } from "@/app/lib/authRedirectUrl";

/** Signs out the current session. Optional ?next= safe internal path (e.g. /athlete/login). */
export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const requestUrl = new URL(request.url);
  const rawNext = requestUrl.searchParams.get("next");
  const destination = rawNext
    ? `${origin}${sanitizeAuthNextPath(rawNext)}`
    : `${origin}/login`;

  let response = NextResponse.redirect(destination);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.signOut();
  return response;
}
