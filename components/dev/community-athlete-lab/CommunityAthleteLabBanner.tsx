import Link from "next/link";
import { COMMUNITY_ATHLETE_LAB_NAV } from "@/app/lib/dev/community-athlete-lab/labNav";

export function CommunityAthleteLabBanner() {
  return (
    <div className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-3 sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-300">
        Community athlete UX lab · mock data only
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-400">
        Isolated from real athletes, programmes and Supabase. HYROX Track Community experience — not the 1-1
        portal. Production route is 404.
      </p>
      <p className="mt-2 hidden flex-wrap gap-2 sm:flex">
        {COMMUNITY_ATHLETE_LAB_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-zinc-800 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-amber-500/40 hover:text-amber-200"
          >
            {item.label}
          </Link>
        ))}
      </p>
    </div>
  );
}
