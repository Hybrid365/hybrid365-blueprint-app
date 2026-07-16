import Image from "next/image";
import { HYROX_TRACK_COMMUNITY } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

export function HyroxTrackCommunity() {
  return (
    <HyroxTrackSection id="community" variant="dark">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <HyroxTrackEyebrow>{HYROX_TRACK_COMMUNITY.eyebrow}</HyroxTrackEyebrow>
          <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
            {HYROX_TRACK_COMMUNITY.headline[0]}
            <span className="block text-[#f4d23c]">{HYROX_TRACK_COMMUNITY.headline[1]}</span>
          </HyroxTrackHeading>
          <ul className="mt-8 flex flex-wrap gap-2">
            {HYROX_TRACK_COMMUNITY.items.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white/70"
              >
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg font-black uppercase tracking-tight text-white sm:text-xl">
            {HYROX_TRACK_COMMUNITY.close[0]}{" "}
            <span className="text-[#f4d23c]">{HYROX_TRACK_COMMUNITY.close[1]}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={HYROX_TRACK_COMMUNITY.photos[0].src}
              alt={HYROX_TRACK_COMMUNITY.photos[0].alt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={HYROX_TRACK_COMMUNITY.photos[1].src}
              alt={HYROX_TRACK_COMMUNITY.photos[1].alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 45vw, 20vw"
            />
          </div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={HYROX_TRACK_COMMUNITY.photos[2].src}
              alt={HYROX_TRACK_COMMUNITY.photos[2].alt}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 45vw, 20vw"
            />
          </div>
        </div>
      </div>
    </HyroxTrackSection>
  );
}
