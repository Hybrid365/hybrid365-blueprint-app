"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpCircle,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Home,
  Trophy,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string, basePath: string) => boolean;
};

function basePlanPath(planId: string) {
  return `/plan/${planId}`;
}

export default function Hybrid75AppNav({ planId }: { planId: string }) {
  const pathname = usePathname();
  const basePath = basePlanPath(planId);

  const items: NavItem[] = [
    {
      href: basePath,
      label: "Home",
      icon: Home,
      match: (path, base) => path === base,
    },
    {
      href: `${basePath}/week`,
      label: "Week",
      icon: CalendarDays,
      match: (path, base) => path.startsWith(`${base}/week`),
    },
    {
      href: `${basePath}/habits`,
      label: "Habits",
      icon: CheckSquare,
      match: (path, base) => path.startsWith(`${base}/habits`),
    },
    {
      href: `${basePath}/leaderboard`,
      label: "Leaderboard",
      icon: Trophy,
      match: (path, base) => path.startsWith(`${base}/leaderboard`),
    },
    {
      href: `${basePath}/check-in`,
      label: "Check-In",
      icon: ClipboardCheck,
      match: (path, base) => path.startsWith(`${base}/check-in`),
    },
    {
      href: `${basePath}/upgrade`,
      label: "Upgrade",
      icon: ArrowUpCircle,
      match: (path, base) => path.startsWith(`${base}/upgrade`),
    },
  ];

  const linkClass = (active: boolean, compact = false) =>
    [
      "flex flex-col items-center justify-center gap-1 rounded-xl transition",
      compact ? "min-w-[4.5rem] px-2 py-2" : "px-4 py-2 text-sm font-semibold",
      active
        ? "bg-[#F4D23C] text-black"
        : compact
        ? "text-white/70 hover:text-white"
        : "border border-white/10 bg-zinc-950 text-white/70 hover:border-[#F4D23C]/40 hover:text-white",
    ].join(" ");

  return (
    <>
      {/* Desktop sticky top nav */}
      <div className="sticky top-0 z-40 hidden border-b border-white/10 bg-black/90 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-3 md:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = item.match(pathname, basePath);
            return (
              <Link key={item.href} href={item.href} className={linkClass(active)}>
                <span className="inline-flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile fixed bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1 overflow-x-auto px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const active = item.match(pathname, basePath);
            return (
              <Link key={item.href} href={item.href} className={linkClass(active, true)}>
                <item.icon className={`h-5 w-5 ${active ? "text-black" : "text-[#F4D23C]"}`} />
                <span className={`text-[10px] font-semibold ${active ? "text-black" : "text-white/80"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
