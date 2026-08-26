"use client";

import { useState, useSyncExternalStore } from "react";
import { START_INTENT_COPY } from "@/app/lib/start/startCopy";
import { StartIntentForm } from "./StartIntentForm";
import { StartSelector } from "./StartSelector";

const STORAGE_KEY = "h365_start_funnel_complete";

function emptySubscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function readComplete() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeComplete() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* private browsing */
  }
}

export function StartExperience() {
  const isClient = useIsClient();
  const [justCompleted, setJustCompleted] = useState(false);
  const restored = isClient && readComplete();
  const step = justCompleted || restored ? "options" : "intent";

  function handleIntentSuccess() {
    writeComplete();
    setJustCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!isClient) {
    return <section className="px-4 py-12 sm:px-6 sm:py-16" aria-hidden />;
  }

  if (step === "options") {
    return <StartSelector />;
  }

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f4d23c]">
          {START_INTENT_COPY.eyebrow}
        </p>
        <h1 className="text-[clamp(1.75rem,5vw,2.75rem)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white">
          {START_INTENT_COPY.headline}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-white/60">{START_INTENT_COPY.body}</p>
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium leading-snug text-white/80">
            {START_INTENT_COPY.assessmentNoteTitle}
          </p>
          <p className="text-[13px] leading-relaxed text-white/45">
            {START_INTENT_COPY.assessmentNoteBody}
          </p>
          <p className="text-[13px] leading-relaxed text-white/50">
            {START_INTENT_COPY.assessmentNoteClose}
          </p>
        </div>
        <div className="mt-8">
          <StartIntentForm onSuccess={handleIntentSuccess} />
        </div>
      </div>
    </section>
  );
}
