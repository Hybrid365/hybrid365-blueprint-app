import Image from "next/image";
import type { AthleteResult } from "@/app/lib/homepage/athleteResults";
import { PlaceholderBadge } from "./homepageUi";

export function AthleteResultCard({ athlete }: { athlete: AthleteResult }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={athlete.photoSrc}
          alt={athlete.photoAlt}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        {athlete.placeholder ? (
          <div className="absolute left-3 top-3">
            <PlaceholderBadge />
          </div>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-lg font-black text-white">{athlete.name}</p>
          {athlete.currentGoal ? (
            <p className="mt-0.5 text-xs text-white/50">Goal: {athlete.currentGoal}</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="grid grid-cols-2 gap-3 border-b border-white/10 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              HYROX PB
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-[#f4d23c]">
              {athlete.hyroxPb}
            </p>
            {athlete.hyroxStart ? (
              <p className="text-xs text-white/40">from {athlete.hyroxStart}</p>
            ) : null}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Improvement
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-white">
              {athlete.improvement}
            </p>
            {athlete.runningPb ? (
              <p className="text-xs text-white/40">5K: {athlete.runningPb}</p>
            ) : null}
          </div>
        </div>

        <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-white/60">
          &ldquo;{athlete.testimonial}&rdquo;
        </blockquote>
      </div>
    </article>
  );
}
