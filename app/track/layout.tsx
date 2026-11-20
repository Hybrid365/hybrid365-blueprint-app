import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import {
  PRODUCTION_TRACK_SUPABASE_REF,
  productionTrackAccessEnabled,
  productionTrackAllowsUser,
  productionTrackRef,
} from "@/app/lib/track-production/access";

export const metadata: Metadata = {
  title: "Track",
  description: "Hybrid365 Track.",
  robots: { index: false, follow: false },
};

export default async function TrackLayout({ children }: { children: React.ReactNode }) {
  const ref = productionTrackRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const productionSurface = process.env.VERCEL_ENV === "production" || ref === PRODUCTION_TRACK_SUPABASE_REF;
  if (productionSurface) {
    if (!productionTrackAccessEnabled()) notFound();
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!productionTrackAllowsUser(data.user)) notFound();
  }
  return <div className="min-h-screen bg-black text-white">{children}</div>;
}
