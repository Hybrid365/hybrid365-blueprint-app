import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TeamShowcaseAthlete } from "@/app/lib/homepage/teamShowcase";

export function TeamShowcaseCard({ athlete }: { athlete: TeamShowcaseAthlete }) {
  return (
    <article className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition duration-500 group-hover:border-white/16 group-hover:shadow-[0_24px_56px_rgba(0,0,0,0.55)]">
        <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/4]">
          <Image
            src={athlete.announcementSrc}
            alt={athlete.announcementAlt}
            fill
            className={cn(
              "object-cover object-center transition duration-700 ease-out motion-reduce:transition-none",
              athlete.hoverSrc && "group-hover:scale-[1.02] group-hover:opacity-0 motion-reduce:group-hover:opacity-100"
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
          />
          {athlete.hoverSrc ? (
            <Image
              src={athlete.hoverSrc}
              alt={athlete.hoverAlt ?? athlete.name}
              fill
              className="object-cover object-center opacity-0 transition duration-700 ease-out motion-reduce:opacity-0 motion-reduce:group-hover:opacity-0 group-hover:scale-[1.02] group-hover:opacity-100"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 540px"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent opacity-60 transition duration-500 group-hover:opacity-40"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-5 px-1">
        <h3 className="text-xl font-black tracking-[-0.02em] text-white sm:text-2xl">
          {athlete.name}
        </h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
          {athlete.roleLabel}
        </p>
        <p className="mt-2 inline-flex rounded-full border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f4d23c]/90">
          {athlete.tag}
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55 transition duration-300 hover:text-white/85"
          aria-label={`View ${athlete.name}'s journey — coming soon`}
        >
          View Journey
          <span aria-hidden>→</span>
        </button>
      </div>
    </article>
  );
}
