"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  Home,
  LayoutGrid,
  LineChart,
  ListChecks,
  Settings,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS, dashboardNavIsActive } from "@/app/lib/dashboardNav";

const dashboardIconForHref: Record<string, typeof Home> = {
  "/dashboard": Home,
  "/dashboard/programme": LayoutGrid,
  "/dashboard/progress": LineChart,
  "/dashboard/habits": ListChecks,
  "/dashboard/challenge": Trophy,
  "/dashboard/assessment": ClipboardList,
  "/dashboard/testing": Timer,
};

const publicNavItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/assessment", icon: ClipboardList, label: "Assessment" },
  { href: "/testing", icon: Timer, label: "Testing" },
  { href: "/programme", icon: LayoutGrid, label: "Programme" },
  { href: "/progress", icon: LineChart, label: "Progress" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const inDashboard = pathname.startsWith("/dashboard");

  if (inDashboard) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:relative md:h-screen md:w-20 md:border-r md:border-t-0">
        <div className="flex flex-col md:h-full md:justify-start md:gap-1 md:py-6">
          <div className="hidden md:mb-4 md:flex md:items-center md:justify-center">
            <span className="text-2xl font-bold text-primary">H</span>
          </div>

          {/* Mobile: two compact rows so taps stay large without horizontal scroll */}
          <div className="grid grid-cols-4 gap-0.5 px-1 py-1.5 md:hidden">
            {DASHBOARD_NAV_ITEMS.slice(0, 4).map((item) => {
              const Icon = dashboardIconForHref[item.href] ?? Home;
              const active = dashboardNavIsActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate text-[9px] font-medium leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-0.5 border-t border-border/60 px-1 pb-2 pt-0.5 md:hidden">
            {DASHBOARD_NAV_ITEMS.slice(4).map((item) => {
              const Icon = dashboardIconForHref[item.href] ?? Home;
              const active = dashboardNavIsActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="max-w-full truncate text-[9px] font-medium leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex md:flex-1 md:flex-col md:gap-1 md:px-1">
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = dashboardIconForHref[item.href] ?? Home;
              const active = dashboardNavIsActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:relative md:h-screen md:w-20 md:border-r md:border-t-0">
      <div className="flex h-16 items-center justify-around md:h-full md:flex-col md:justify-start md:gap-2 md:py-6">
        <div className="hidden md:mb-6 md:flex md:items-center md:justify-center">
          <span className="text-2xl font-bold text-primary">H</span>
        </div>
        {publicNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors md:h-14 md:w-14",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium md:hidden">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
