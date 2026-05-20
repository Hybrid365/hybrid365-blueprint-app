import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { athleteCardInteractive, athleteCardPadding } from "./athleteUi";

export function HubLinkCard({
  href,
  title,
  description,
  icon: Icon,
  meta,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex min-h-[120px] items-start gap-4 ${athleteCardInteractive} ${athleteCardPadding}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 ring-1 ring-yellow-400/20 transition group-hover:bg-yellow-400/15 group-hover:ring-yellow-400/35">
        <Icon className="h-5 w-5 text-yellow-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white transition group-hover:text-yellow-100">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">{description}</p>
        {meta ? <p className="mt-2 text-xs font-medium text-yellow-400/80">{meta}</p> : null}
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-yellow-400" />
    </Link>
  );
}
