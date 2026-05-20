import type { ReactNode } from "react";
import type { DashboardSectionId } from "@/app/lib/hyroxTeamDashboardMock";
import { SECTION_SCROLL_MARGIN } from "./nav";

export function SectionShell({
  id,
  title,
  subtitle,
  action,
  children,
}: {
  id: DashboardSectionId;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`${SECTION_SCROLL_MARGIN} space-y-4`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
