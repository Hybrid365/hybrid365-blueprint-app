import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MeetTeamMember } from "@/app/lib/homepage/meetTheTeam";

export function MeetTeamCard({ member }: { member: MeetTeamMember }) {
  const isFeatured = Boolean(member.featured);

  return (
    <article className="group flex flex-col">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition duration-500",
          isFeatured
            ? "border-[#f4d23c]/30 group-hover:border-[#f4d23c]/45"
            : "border-white/10 group-hover:border-white/16"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            isFeatured ? "aspect-[4/5] sm:aspect-[3/4]" : "aspect-[4/5] sm:aspect-[3/4]"
          )}
        >
          <Image
            src={member.photoSrc}
            alt={member.photoAlt}
            fill
            className={cn(
              "object-cover transition duration-700 ease-out motion-reduce:transition-none",
              isFeatured ? "object-[center_15%]" : "object-center",
              member.hoverSrc &&
                "group-hover:scale-[1.02] group-hover:opacity-0 motion-reduce:group-hover:opacity-100"
            )}
            sizes={
              isFeatured
                ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            }
            priority={isFeatured}
          />
          {member.hoverSrc ? (
            <Image
              src={member.hoverSrc}
              alt={member.hoverAlt ?? member.name}
              fill
              className="object-cover object-center opacity-0 transition duration-700 ease-out motion-reduce:opacity-0 group-hover:scale-[1.02] group-hover:opacity-100"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            />
          ) : null}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/25 to-transparent"
            aria-hidden
          />
          {isFeatured ? (
            <span className="absolute left-4 top-4 rounded-full border border-[#f4d23c]/40 bg-[#050505]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#f4d23c] backdrop-blur-sm">
              Founder
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 px-1">
        <h3 className="text-xl font-black tracking-[-0.02em] text-white sm:text-2xl">
          {member.name}
        </h3>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
          {member.roleLabel}
        </p>
        <dl className="mt-3 space-y-1.5">
          {member.metrics.map((metric) => (
            <div key={metric.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
                {metric.label}
              </dt>
              <dd className="text-sm font-black tabular-nums text-white/90">{metric.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 inline-flex rounded-full border border-[#f4d23c]/25 bg-[#f4d23c]/[0.06] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#f4d23c]/90">
          {member.tag}
        </p>
      </div>
    </article>
  );
}
