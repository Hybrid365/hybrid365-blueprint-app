import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ViewAsPageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy path — redirects into the secure read-only preview. */
export default async function HyroxAthleteViewAsPage({ params }: ViewAsPageProps) {
  const { id } = await params;
  redirect(`/admin/hyrox-athletes/${id}/preview/start`);
}
