import Link from "next/link";
import { Hybrid11ApplicationDetailClient } from "@/components/admin-one-to-one-applications/Hybrid11ApplicationDetailClient";
import { HyroxPageShell } from "@/components/hyrox-team/HyroxTeamUi";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Application detail | Hybrid 1-1 Coach",
};

type Props = { params: Promise<{ id: string }> };

export default async function OneToOneApplicationDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <HyroxPageShell maxWidth="max-w-[960px]">
      <header className="mb-6 border-b border-zinc-800/80 pb-5">
        <Link
          href="/admin/one-to-one-applications"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition hover:border-yellow-500/40 hover:text-yellow-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Hybrid 1-1 applications
        </Link>
      </header>

      <Hybrid11ApplicationDetailClient applicationId={id} />
    </HyroxPageShell>
  );
}
