import { HYROX_TRACK_PROMISE } from "@/app/lib/hyrox-community/hyroxTrackSales";
import {
  HyroxTrackSection,
  HyroxTrackEyebrow,
  HyroxTrackHeading,
} from "./hyroxTrackUi";

/** Performance Promise only — no money-back claim until formal terms are approved. */
export function HyroxTrackPromise() {
  return (
    <HyroxTrackSection id={HYROX_TRACK_PROMISE.id} variant="accent">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 text-center sm:p-10 lg:mx-0 lg:text-left">
        <HyroxTrackEyebrow>{HYROX_TRACK_PROMISE.eyebrow}</HyroxTrackEyebrow>
        <HyroxTrackHeading className="text-[clamp(1.5rem,4vw,2.25rem)]">
          {HYROX_TRACK_PROMISE.headline}
        </HyroxTrackHeading>
        <p className="mt-5 text-base leading-relaxed text-white/60 sm:text-lg">
          {HYROX_TRACK_PROMISE.body}
        </p>
        <p className="mt-4 text-sm text-white/40">{HYROX_TRACK_PROMISE.note}</p>
      </div>
    </HyroxTrackSection>
  );
}
