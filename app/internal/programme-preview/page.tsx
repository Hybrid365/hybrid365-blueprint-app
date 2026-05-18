import { notFound, redirect } from "next/navigation";
import { isInternalAdminEmail } from "@/app/lib/internalAdminAccess";
import { createClient } from "@/app/lib/supabase/server";
import ProgrammePreviewClient from "./ProgrammePreviewClient";

export const metadata = {
  title: "Programme QA Preview | Hybrid365 Internal",
  description: "Internal-only 12-week programme generation preview.",
  robots: { index: false, follow: false },
};

export default async function InternalProgrammePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/internal/programme-preview");
  }

  if (!isInternalAdminEmail(user.email)) {
    notFound();
  }

  const adminListConfigured = Boolean(process.env.INTERNAL_ADMIN_EMAILS?.trim());

  return (
    <ProgrammePreviewClient
      userEmail={user.email ?? ""}
      adminListConfigured={adminListConfigured}
    />
  );
}
