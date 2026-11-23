"use client";

import type { ReactNode } from "react";
import { WeekDateNav, type WeekDateNavDay } from "@/components/athlete-command-centre/visual-system/navigation/WeekDateNav";

export function TrackChrome({
  eyebrow,
  countdown,
  days,
  selectedDay,
  onSelectDay,
  screen,
  onScreen,
  children,
}: {
  eyebrow: string;
  countdown?: string | null;
  days: WeekDateNavDay[];
  selectedDay: string;
  onSelectDay: (id: string) => void;
  screen: "home" | "week" | "progress" | "performance";
  onScreen: (screen: "home" | "week" | "progress" | "performance") => void;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--h365-background)] text-[var(--h365-text)]">
      <div className="mx-auto w-full max-w-[430px] pb-24 lg:max-w-6xl lg:px-8">
        <header className="px-4 pt-4 lg:px-0">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="label-caps text-[var(--h365-accent)]">Hybrid365 Track</p>
              <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight">{eyebrow}</h1>
            </div>
            {countdown ? <p className="max-w-[9rem] text-right text-xs font-semibold leading-snug text-[var(--h365-text-muted)]">{countdown}</p> : null}
          </div>
        </header>
        <div className="sticky top-0 z-20 mt-3 border-b border-[var(--h365-border)] bg-[var(--h365-background)]/95 px-2 py-1 backdrop-blur lg:px-0">
          <WeekDateNav days={days} selectedId={selectedDay} onSelect={onSelectDay} />
        </div>
        <div className="px-4 pt-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.75fr)] lg:items-start lg:gap-8 lg:px-0">{children}</div>
        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[430px] -translate-x-1/2 justify-between border-t border-[var(--h365-border)] bg-[var(--h365-background)]/95 px-3 py-2 backdrop-blur lg:left-auto lg:max-w-6xl lg:translate-x-0">
          {(
            [
              ["home", "Home"],
              ["week", "Week"],
              ["progress", "Progress"],
              ["performance", "Performance"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onScreen(id)}
              className={`min-h-11 flex-1 text-xs font-bold uppercase tracking-[0.14em] ${screen === id ? "text-[var(--h365-accent)]" : "text-[var(--h365-text-muted)]"}`}
            >
              <span className={screen === id ? "border-b-2 border-[var(--h365-accent)] pb-1" : ""}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

export function SetupRing({ complete, total }: { complete: number; total: number }) {
  const ratio = total > 0 ? complete / total : 0;
  return (
    <div
      className="grid h-16 w-16 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--h365-accent) ${ratio * 360}deg, var(--h365-border) 0deg)` }}
      aria-hidden
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--h365-background)]">
        <span className="font-display text-lg font-bold leading-none">
          {complete}
          <span className="text-xs text-[var(--h365-text-muted)]">/{total}</span>
        </span>
      </div>
    </div>
  );
}
