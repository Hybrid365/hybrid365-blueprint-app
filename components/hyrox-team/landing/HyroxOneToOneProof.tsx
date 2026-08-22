import Image from "next/image";
import { HYROX_ONE_TO_ONE_PROOF } from "@/app/lib/hyrox-team/landing/hyroxOneToOneLanding";
import {
  HyroxOneToOneEyebrow,
  HyroxOneToOneHeading,
  HyroxOneToOneSection,
} from "./hyroxOneToOneLandingUi";

export function HyroxOneToOneProof() {
  return (
    <HyroxOneToOneSection id="sub-60" variant="default">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <HyroxOneToOneEyebrow>{HYROX_ONE_TO_ONE_PROOF.eyebrow}</HyroxOneToOneEyebrow>
          <HyroxOneToOneHeading className="text-[clamp(1.85rem,5.5vw,3rem)]">
            {HYROX_ONE_TO_ONE_PROOF.headline[0]}
            <span className="block text-[#f4d23c]">{HYROX_ONE_TO_ONE_PROOF.headline[1]}</span>
          </HyroxOneToOneHeading>
          <div className="mt-6 space-y-3 text-sm leading-relaxed text-white/55 sm:text-base">
            {HYROX_ONE_TO_ONE_PROOF.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HYROX_ONE_TO_ONE_PROOF.metrics.map((m) => (
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
            src={HYROX_ONE_TO_ONE_PROOF.imageSrc}
            alt={HYROX_ONE_TO_ONE_PROOF.imageAlt}
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </div>
    </HyroxOneToOneSection>
  );
}
