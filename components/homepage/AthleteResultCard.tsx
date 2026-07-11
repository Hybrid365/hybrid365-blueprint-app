import Image from "next/image";
import type { AthleteResult } from "@/app/lib/homepage/athleteResults";
import { PlaceholderBadge } from "./homepageUi";

export function AthleteResultCard({ athlete }: { athlete: AthleteResult }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden [clip-path:polygon(0_0,100%_0,100%_92%,0_100%)]">
        <Image
          src={athlete.photoSrc}
          alt={athlete.photoAlt}
          fill
          className="object-cover brightness-[0.8] contrast-[1.06] transition duration-700 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 88vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_50%,#050505_100%)] opacity-60" />

        {athlete.placeholder ? (
          <div className="absolute left-4 top-4">
            <PlaceholderBadge />
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-lg font-black text-white">{athlete.name}</p>
          {athlete.currentGoal ? (
            <p className="mt-0.5 text-xs text-white/50">Goal: {athlete.currentGoal}</p>
          ) : null}
        </div>
      </div>

      <div className="relative -mt-6 mx-4 rounded-xl border border-white/10 bg-[#0c0c0c]/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              HYROX PB
            </p>
            <p className="mt-1 text-xl font-black tabular-nums text-[#f4d23c]">
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
            <p className="mt-1 text-xl font-black tabular-nums text-[#4ade80]">
              {athlete.improvement}
            </p>
            {athlete.runningPb ? (
              <p className="text-xs text-white/40">5K: {athlete.runningPb}</p>
            ) : null}
          </div>
        </div>
        <p className="mt-4 border-t border-white/8 pt-3 text-sm italic leading-relaxed text-white/55">
          &ldquo;{athlete.testimonial}&rdquo;
        </p>
      </div>
    </article>
  );
}
