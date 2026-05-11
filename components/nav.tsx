"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Timer, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/assessment", icon: ClipboardList, label: "Assessment" },
  { href: "/testing", icon: Timer, label: "Testing" },
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const inDashboard = pathname.startsWith("/dashboard");

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm md:relative md:h-screen md:w-20 md:border-r md:border-t-0">
      <div className="flex h-16 items-center justify-around md:h-full md:flex-col md:justify-start md:gap-2 md:py-6">
        <div className="hidden md:mb-6 md:flex md:items-center md:justify-center">
          <span className="text-2xl font-bold text-primary">H</span>
        </div>
        {navItems.map((item) => {
          const resolvedHref =
            inDashboard && item.href !== "/"
              ? `/dashboard${item.href}`
              : inDashboard
                ? "/dashboard"
                : item.href;

          const isActive = pathname === resolvedHref;
          return (
            <Link
              key={item.href}
              href={resolvedHref}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors md:h-14 md:w-14",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
