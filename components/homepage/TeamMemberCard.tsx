import Image from "next/image";
import type { TeamMember } from "@/app/lib/homepage/teamMembers";
import { PlaceholderBadge } from "./homepageUi";

export function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
      <div className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={member.photoSrc}
          alt={member.photoAlt}
          fill
          className="object-cover object-top brightness-[0.9] transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {member.placeholder ? (
          <div className="absolute left-2 top-2">
            <PlaceholderBadge />
          </div>
        ) : null}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-base font-black text-white">{member.name}</p>
        <p className="text-[11px] font-medium text-white/50">{member.location}</p>

        <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 border-t border-white/10 pt-3">
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wider text-white/35">
              HYROX PB
            </dt>
            <dd className="text-sm font-black tabular-nums text-[#f4d23c]">
              {member.currentPb}
            </dd>
          </div>
          <div>
            <dt className="text-[9px] font-bold uppercase tracking-wider text-white/35">
              5K PB
            </dt>
            <dd className="text-sm font-black tabular-nums text-white">
              {member.fiveKpb ?? "—"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[9px] font-bold uppercase tracking-wider text-white/35">
              Goal
            </dt>
            <dd className="text-xs font-medium text-white/70">{member.goal}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[9px] font-bold uppercase tracking-wider text-white/35">
              With Hybrid365
            </dt>
            <dd className="text-xs font-medium text-white/50">
              {member.coachingDuration}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
