import Image from "next/image";
import { HYROX_TRACK_SUB60 } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

export function HyroxTrackSub60() {
  return (
    <HyroxTrackSection id="sub-60" variant="default">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <HyroxTrackEyebrow>{HYROX_TRACK_SUB60.eyebrow}</HyroxTrackEyebrow>
          <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
            {HYROX_TRACK_SUB60.headline[0]}
            <span className="block text-[#f4d23c]">{HYROX_TRACK_SUB60.headline[1]}</span>
          </HyroxTrackHeading>
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-white/55 sm:text-base">
            {HYROX_TRACK_SUB60.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HYROX_TRACK_SUB60.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-4 text-center"
              >
                <p
                  className={`text-xl font-black tabular-nums sm:text-2xl ${
                    m.accent ? "text-[#f4d23c]" : "text-white"
                  }`}
                >
                  {m.value}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
          <Image
            src="/images/hyrox-team/Hyrox-Result.jpg"
            alt="HYROX race finish — Hybrid365 founder progression"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </div>
    </HyroxTrackSection>
  );
}
