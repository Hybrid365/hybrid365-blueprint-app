import Link from "next/link";
import { HYROX_ONE_TO_ONE_APPLY_HREF } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import { HyroxOneToOneApplyCta } from "./hyroxOneToOneLandingUi";

export function HyroxTeamHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-[#050505]/92 backdrop-blur-md">
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between gap-4 px-4 sm:h-[68px] sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-black uppercase tracking-[0.12em] text-white">
          Hybrid<span className="text-[#f4d23c]">365</span>
        </Link>
        <HyroxOneToOneApplyCta href={HYROX_ONE_TO_ONE_APPLY_HREF} className="min-h-[40px] px-5 text-xs">
          Apply
        </HyroxOneToOneApplyCta>
      </div>
    </header>
  );
}
