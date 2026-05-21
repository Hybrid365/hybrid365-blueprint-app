"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { ProgrammeRefreshRequestModal } from "@/components/dashboard/ProgrammeRefreshRequestModal";

type Props = {
  /** Highlight after a successful save in this session. */
  emphasized?: boolean;
};

export function ProgrammeRefreshAssessmentNote({ emphasized = false }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section
        className={`mb-6 rounded-2xl border px-4 py-4 sm:px-5 sm:py-5 ${
          emphasized
            ? "border-yellow-500/35 bg-yellow-400/[0.08]"
            : "border-border bg-card/80"
        }`}
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Updated your assessment?</span> Your current programme
          will continue as planned. If your goal, 5km time, max HR, equipment or availability has changed
          significantly, request a programme refresh.
        </p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-400/10 px-4 py-2.5 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-400/15 dark:text-yellow-200"
        >
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          Request programme refresh
        </button>
      </section>
      <ProgrammeRefreshRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
