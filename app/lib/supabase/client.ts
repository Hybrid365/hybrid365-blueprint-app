import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "pkce",
        /** Server route `/auth/callback` exchanges the code — avoid client double-exchange. */
        detectSessionInUrl: false,
      },
    }
  );
}
