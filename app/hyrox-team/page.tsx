import type { Metadata } from "next"
import { HyroxOneToOneAthletes } from "@/components/hyrox-team/landing/HyroxOneToOneAthletes"
import { HyroxOneToOneCinematicTraining } from "@/components/hyrox-team/landing/HyroxOneToOneCinematicTraining"
import { HyroxOneToOneHero } from "@/components/hyrox-team/landing/HyroxOneToOneHero"
import { HyroxOneToOneLiveCoaching } from "@/components/hyrox-team/landing/HyroxOneToOneLiveCoaching"
import { HyroxOneToOneProof } from "@/components/hyrox-team/landing/HyroxOneToOneProof"
import { HyroxOneToOneSystemGallery } from "@/components/hyrox-team/landing/HyroxOneToOneSystemGallery"
import { HyroxTeamFinalCta } from "@/components/hyrox-team/landing/HyroxTeamFinalCta"
import { HyroxTeamHeader } from "@/components/hyrox-team/landing/HyroxTeamHeader"
import { HyroxTeamInclusions } from "@/components/hyrox-team/landing/HyroxTeamInclusions"
import { HyroxTeamJourney } from "@/components/hyrox-team/landing/HyroxTeamJourney"
import { HyroxTeamWhoFor } from "@/components/hyrox-team/landing/HyroxTeamWhoFor"

export const metadata: Metadata = {
  title: {
    absolute: "Hybrid365 HYROX Team | Individual Coaching",
  },
  description:
    "Individual HYROX coaching, direct coach involvement and a performance team built around helping you race faster. Apply to join the Hybrid365 HYROX Team.",
}

export default function HyroxTeamPage() {
  return (
    <div className="overflow-x-hidden bg-[#050505] font-sans text-white">
      <HyroxTeamHeader />
      <main>
        <HyroxOneToOneHero />
        <HyroxOneToOneAthletes />
        <HyroxOneToOneSystemGallery />
        <HyroxTeamInclusions />
        <HyroxTeamJourney />
        <HyroxOneToOneProof />
        <HyroxOneToOneCinematicTraining />
        <HyroxOneToOneLiveCoaching />
        <HyroxTeamWhoFor />
        <HyroxTeamFinalCta />
      </main>
    </div>
  )
}
