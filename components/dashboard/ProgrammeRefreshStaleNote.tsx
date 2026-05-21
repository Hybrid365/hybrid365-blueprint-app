"use client";

import { useState } from "react";
import { ProgrammeRefreshRequestModal } from "@/components/dashboard/ProgrammeRefreshRequestModal";

export function ProgrammeRefreshStaleNote() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <p className="mb-6 rounded-xl border border-zinc-800/90 bg-zinc-900/40 px-4 py-3 text-sm leading-relaxed text-zinc-400">
        Your assessment has changed since this programme was generated. Some new guidance may apply after a{" "}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="font-medium text-yellow-400/90 underline-offset-2 hover:text-yellow-300 hover:underline"
        >
          programme refresh
        </button>
        .
      </p>
      <ProgrammeRefreshRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
