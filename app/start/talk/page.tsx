import type { Metadata } from "next";
import { TALK_COPY } from "@/app/lib/start/startCopy";
import { StartShell } from "@/components/start/StartShell";
import { TalkToKieranForm } from "@/components/start/TalkToKieranForm";

export const metadata: Metadata = {
  title: "Talk to Kieran",
  description:
    "Not sure whether HYROX Track or 1-1 coaching fits? Send a few details and Kieran will point you in the right direction.",
};

export default function TalkToKieranPage() {
  return (
    <StartShell backHref="/start" backLabel="Back to coaching options">
      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
            {TALK_COPY.eyebrow}
          </p>
          <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white">
            {TALK_COPY.headline}
          </h1>
          <p className="mt-5 text-base leading-relaxed text-white/60">{TALK_COPY.body}</p>
          <div className="mt-8">
            <TalkToKieranForm />
          </div>
        </div>
      </section>
    </StartShell>
  );
}
