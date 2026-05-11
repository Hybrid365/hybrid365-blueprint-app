"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_ITEMS, dashboardNavIsActive } from "@/app/lib/dashboardNav";

type Variant = "zinc" | "light";

export function DashboardSubnav({ variant = "zinc" }: { variant?: "zinc" | "light" }) {
  const pathname = usePathname();

  const active =
    variant === "zinc"
      ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
      : "border-primary bg-primary/10 text-primary";

  const idle =
    variant === "zinc"
      ? "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700/60 hover:text-white"
      : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-border";

  return (
    <nav aria-label="Dashboard sections" className="flex flex-wrap gap-2">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const isActive = dashboardNavIsActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-[40px] items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition",
              isActive ? active : idle
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
