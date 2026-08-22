"use client";

import type { HTMLAttributes } from "react";
import type { TalkEnquiryInput } from "@/app/lib/start/talkEnquiry";
import { ATTRIBUTION_QUERY_KEYS } from "@/app/lib/start/attribution";

export const enquiryInputClasses =
  "w-full min-h-[48px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-[#F4D23C]/50 focus:outline-none focus:ring-1 focus:ring-[#F4D23C]/50 sm:text-sm";

export function collectEnquiryAttribution() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const attribution: Record<string, string> = {
    landing_path: `${window.location.pathname}${window.location.search}`,
  };
  for (const key of ATTRIBUTION_QUERY_KEYS) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value;
  }
  return attribution;
}

export async function submitCoachingEnquiry(
  payload: TalkEnquiryInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/start/talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await response.json().catch(() => null)) as
      | { success?: boolean; error?: string }
      | null;
    if (!response.ok || !json?.success) {
      return {
        ok: false,
        error: json?.error || "Couldn't send your details just yet. Please try again shortly.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Couldn't send your details just yet. Please try again shortly.",
    };
  }
}

export function EnquiryHoneypot() {
  return (
    <div className="absolute left-[-10000px] h-px w-px overflow-hidden" aria-hidden>
      <label htmlFor="company_website">Company website</label>
      <input
        id="company_website"
        name="company_website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export function EnquiryField({
  label,
  name,
  required,
  type = "text",
  placeholder,
  hint,
  textarea,
  autoComplete,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  inputMode,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  autoComplete?: string;
  autoCapitalize?: string;
  autoCorrect?: string;
  spellCheck?: boolean;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-xs font-medium uppercase tracking-wider text-white/60">
        {label}
        {required ? <span className="ml-1 text-[#F4D23C]">*</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          required={required}
          placeholder={placeholder}
          rows={4}
          className={`${enquiryInputClasses} min-h-[120px] resize-none`}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          placeholder={placeholder}
          className={enquiryInputClasses}
          autoComplete={autoComplete ?? (name === "email" ? "email" : name === "first_name" ? "given-name" : "off")}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          inputMode={inputMode}
        />
      )}
      {hint ? <p className="text-xs leading-relaxed text-white/45">{hint}</p> : null}
    </div>
  );
}
