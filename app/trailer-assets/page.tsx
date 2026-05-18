import { notFound, redirect } from "next/navigation";
import { isInternalAdminEmail } from "@/app/lib/internalAdminAccess";
import { createClient } from "@/app/lib/supabase/server";
import TrailerAssetsClient from "./TrailerAssetsClient";

export const metadata = {
  title: "Trailer Assets | Hybrid365 Internal",
  description: "Internal mock UI for Hyrox365 Team trailer screenshots and screen recordings.",
  robots: { index: false, follow: false },
};

export default async function TrailerAssetsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/trailer-assets");
  }

  if (!isInternalAdminEmail(user.email)) {
    notFound();
  }

  return <TrailerAssetsClient userEmail={user.email ?? ""} />;
}
