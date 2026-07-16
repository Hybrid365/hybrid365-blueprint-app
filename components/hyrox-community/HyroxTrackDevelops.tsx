import { HYROX_TRACK_DEVELOPS } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

export function HyroxTrackDevelops() {
  return (
    <HyroxTrackSection id="develops" variant="default">
      <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
        <HyroxTrackEyebrow>{HYROX_TRACK_DEVELOPS.eyebrow}</HyroxTrackEyebrow>
        <HyroxTrackHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
          {HYROX_TRACK_DEVELOPS.headline[0]}
          <span className="block text-[#f4d23c]">{HYROX_TRACK_DEVELOPS.headline[1]}</span>
        </HyroxTrackHeading>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {HYROX_TRACK_DEVELOPS.areas.map((area) => (
          <article
            key={area.title}
            className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-6"
          >
            <h3 className="text-sm font-black uppercase tracking-wide text-[#f4d23c]">
              {area.title}
            </h3>
            <ul className="mt-4 space-y-2">
              {area.items.map((item) => (
                <li key={item} className="text-sm text-white/70">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </HyroxTrackSection>
  );
}
