import type { Metadata } from "next";
import { HyroxTrackHero } from "@/components/hyrox-community/HyroxTrackHero";
import { HyroxTrackAthletes } from "@/components/hyrox-community/HyroxTrackAthletes";
import { HyroxTrackSub60 } from "@/components/hyrox-community/HyroxTrackSub60";
import { HyroxTrackSystemGallery } from "@/components/hyrox-community/HyroxTrackSystemGallery";
import { HyroxTrackPersonalised } from "@/components/hyrox-community/HyroxTrackPersonalised";
import { HyroxTrackCommunity } from "@/components/hyrox-community/HyroxTrackCommunity";
import { HyroxTrackDevelops } from "@/components/hyrox-community/HyroxTrackDevelops";
import { HyroxTrackPromise } from "@/components/hyrox-community/HyroxTrackPromise";
import { HyroxTrackPricing } from "@/components/hyrox-community/HyroxTrackPricing";
import { HyroxTrackFaq } from "@/components/hyrox-community/HyroxTrackFaq";
import { HyroxTrackFinalCta } from "@/components/hyrox-community/HyroxTrackFinalCta";

export const metadata: Metadata = {
  title: "Hybrid365 HYROX Track | £39.99/month Personalised HYROX Programming",
  description:
    "Personalised HYROX programming, detailed coaching dashboard, performance testing, weekly accountability and selected team training days — £39.99/month.",
};

export default function HyroxCommunityPage() {
  return (
    <div className="bg-[#050505] text-white">
      <main>
        <HyroxTrackHero />
        <HyroxTrackAthletes />
        <HyroxTrackSub60 />
        <HyroxTrackSystemGallery />
        <HyroxTrackPersonalised />
        <HyroxTrackCommunity />
        <HyroxTrackDevelops />
        <HyroxTrackPromise />
        <HyroxTrackPricing />
        <HyroxTrackFaq />
        <HyroxTrackFinalCta />
      </main>
    </div>
  );
}
