"use client";

import { DASHBOARD_SECTIONS } from "@/app/lib/hyroxTeamDashboardMock";
import type { DashboardSectionId } from "@/app/lib/hyroxTeamDashboardMock";
import { scrollToSection } from "./nav";

type Props = {
  activeSection?: DashboardSectionId;
};

export function MobileAnchorBar({ activeSection }: Props) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-zinc-800 bg-black/95 px-4 py-2 backdrop-blur-md lg:hidden">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DASHBOARD_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(s.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              activeSection === s.id
                ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-300"
                : "border-zinc-700 text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
