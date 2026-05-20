import type { DashboardSectionId } from "@/app/lib/hyroxTeamDashboardMock";

export function scrollToSection(id: DashboardSectionId) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export const SECTION_SCROLL_MARGIN = "scroll-mt-28 lg:scroll-mt-8";
