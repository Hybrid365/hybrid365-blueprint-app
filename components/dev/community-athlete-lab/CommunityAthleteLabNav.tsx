"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  LayoutGrid,
  LineChart,
  ListChecks,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMUNITY_ATHLETE_LAB_NAV,
  communityAthleteLabNavIsActive,
} from "@/app/lib/dev/community-athlete-lab/labNav";

const icons = {
  Dashboard: Home,
  Programme: LayoutGrid,
  Progress: LineChart,
  Habits: ListChecks,
  "Check-In": ClipboardList,
  Testing: Timer,
} as const;

export function CommunityAthleteLabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm md:relative md:h-screen md:w-20 md:border-r md:border-t-0">
      <div className="flex flex-col md:h-full md:justify-start md:gap-1 md:py-6">
        <div className="hidden md:mb-4 md:flex md:items-center md:justify-center">
          <span className="text-2xl font-bold text-yellow-400">H</span>
        </div>
        <div className="grid grid-cols-3 gap-0.5 px-1 py-1.5 md:hidden">
          {COMMUNITY_ATHLETE_LAB_NAV.slice(0, 3).map((item) => (
            <LabNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-0.5 border-t border-zinc-800/60 px-1 pb-2 pt-0.5 md:hidden">
          {COMMUNITY_ATHLETE_LAB_NAV.slice(3).map((item) => (
            <LabNavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="hidden md:flex md:flex-col md:gap-1 md:px-2">
          {COMMUNITY_ATHLETE_LAB_NAV.map((item) => (
            <LabNavLink key={item.href} item={item} pathname={pathname} desktop />
          ))}
        </div>
      </div>
    </nav>
  );
}

function LabNavLink({
  item,
  pathname,
  desktop,
}: {
  item: (typeof COMMUNITY_ATHLETE_LAB_NAV)[number];
  pathname: string;
  desktop?: boolean;
}) {
  const Icon = icons[item.label];
  const active = communityAthleteLabNavIsActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        desktop
          ? "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium"
          : "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1",
        active ? "bg-yellow-400/10 text-yellow-300" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="max-w-full truncate text-[9px] font-medium leading-tight md:text-[10px]">
        {item.label}
      </span>
    </Link>
  );
}
