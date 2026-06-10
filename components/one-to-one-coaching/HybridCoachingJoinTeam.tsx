import Image from "next/image";
import { APPLY_URL, PrimaryButton } from "@/components/one-to-one-coaching/landingUi";

const TEAM_CARDS = [
  {
    title: "Team training meet-ups",
    description:
      "Invites to Hybrid365 team training sessions and in-person meet-ups when available.",
  },
  {
    title: "Like-minded environment",
    description:
      "Surround yourself with people who want to get stronger, faster, fitter and more disciplined.",
  },
  {
    title: "Monthly nutrition support",
    description:
      "Ongoing nutrition guidance, recipe support, cookbooks, meal ideas and practical support for body composition and performance.",
  },
  {
    title: "High accountability",
    description:
      "Weekly check-ins, coach feedback and standards that keep you progressing.",
  },
  {
    title: "Performance culture",
    description:
      "A training environment built around lifting with intent, running with purpose and building a body that performs.",
  },
  {
    title: "Not doing it alone",
    description:
      "Structure, feedback, standards and a team around you — not just a plan dropped into an app.",
  },
];

export function HybridCoachingJoinTeam() {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#f4d23c]">
          More than a programme
        </p>
        <h2 className="mt-4 text-[clamp(32px,5vw,64px)] font-black uppercase leading-[0.92] tracking-[-0.065em]">
          Join the
          <br />
          <span className="text-[#f4d23c]">Hybrid365 Team</span>
        </h2>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#d9d9d9] md:text-lg">
          Hybrid365 1-1 coaching is built to feel like you&apos;re part of something bigger than a
          training plan. You&apos;ll have your own personalised programme and athlete dashboard, but
          you&apos;ll also be connected to the standards, accountability and environment of the
          Hybrid365 team.
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[#a9a9a9]">
          From team training meet-ups to weekly check-ins, monthly nutrition support and being
          around people who want to get stronger, faster and fitter, the goal is simple: create the
          environment that makes high standards normal.
        </p>
        <div className="mt-8">
          <PrimaryButton href={APPLY_URL}>Apply for 1-1 coaching</PrimaryButton>
          <p className="mt-4 text-sm font-semibold text-zinc-500">
            Limited spaces. Application-based.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="relative mb-4 hidden overflow-hidden rounded-[20px] border border-white/10 sm:block lg:mb-5">
          <div className="relative h-[140px]">
            <Image
              src="/images/community/Main Hero photo of me.jpg"
              alt="Hybrid365 training environment"
              fill
              className="object-cover object-top brightness-[0.72]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#f4d23c]">
                Train with intent
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">
                Standards · accountability · performance
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {TEAM_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-[20px] border border-white/[0.11] bg-gradient-to-b from-white/[0.065] to-white/[0.025] p-5 sm:rounded-[22px]"
            >
              <h3 className="m-0 mb-2 text-base font-black leading-tight tracking-[-0.03em] text-white">
                {card.title}
              </h3>
              <p className="m-0 text-sm leading-[1.45] text-[#a9a9a9]">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
