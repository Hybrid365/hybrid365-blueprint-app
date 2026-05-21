import Link from "next/link";
import { HyroxPrimaryButton } from "@/components/hyrox-team/HyroxTeamUi";
import type { AthleteNextAction } from "@/app/lib/hyroxAthleteOnboardingFlow";

export function AthleteNextStepCard({
  action,
  eyebrow = "Your next step",
}: {
  action: AthleteNextAction;
  eyebrow?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#f4d23c]/25 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/20 p-6 sm:p-8">
      <p className="m-0 text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">{eyebrow}</p>
      <h2 className="m-0 mt-3 text-xl font-black uppercase tracking-[-0.04em] text-white sm:text-2xl">
        {action.title}
      </h2>
      <p className="m-0 mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">{action.copy}</p>
      <div className="mt-6">
        <HyroxPrimaryButton href={action.href}>{action.buttonLabel}</HyroxPrimaryButton>
      </div>
    </div>
  );
}

export function AthleteSecondaryLink({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.04] px-6 text-center text-sm font-black text-[#f6f6f6] transition hover:bg-white/[0.07]"
    >
      {label}
    </Link>
  );
}
