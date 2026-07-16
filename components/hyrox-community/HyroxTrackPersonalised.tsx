import { HYROX_TRACK_PERSONALISED } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

export function HyroxTrackPersonalised() {
  return (
    <HyroxTrackSection id="assessment" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HyroxTrackEyebrow>{HYROX_TRACK_PERSONALISED.eyebrow}</HyroxTrackEyebrow>
        <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {HYROX_TRACK_PERSONALISED.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_TRACK_PERSONALISED.headline[1]}</span>
        </HyroxTrackHeading>
      </div>

      <ol className="relative mt-12 hidden gap-4 lg:grid lg:grid-cols-4">
        <div
          className="pointer-events-none absolute left-[8%] right-[8%] top-5 h-px bg-gradient-to-r from-white/15 via-[#f4d23c]/35 to-white/15"
          aria-hidden
        />
        {HYROX_TRACK_PERSONALISED.stages.map((stage) => (
          <li key={stage.number} className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#f4d23c]/50 bg-[#0a0a0a] text-xs font-black text-[#f4d23c]">
              {stage.number}
            </div>
            <h3 className="mt-4 text-base font-black uppercase tracking-tight text-white">
              {stage.title}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <ol className="mt-10 space-y-6 lg:hidden">
        {HYROX_TRACK_PERSONALISED.stages.map((stage) => (
          <li key={stage.number} className="relative border-l border-[#f4d23c]/35 pl-5">
            <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-[#f4d23c]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]/80">
              {stage.number} · {stage.title}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {stage.items.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/65"
                >
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-center text-base font-black uppercase tracking-tight text-white sm:text-lg lg:text-left">
        {HYROX_TRACK_PERSONALISED.close[0]}{" "}
        <span className="text-[#f4d23c]">{HYROX_TRACK_PERSONALISED.close[1]}</span>
      </p>
    </HyroxTrackSection>
  );
}
