/** Founder credibility — update values when new benchmarks are logged. */

export const FOUNDER_STATS = [
  { value: "59:14", label: "Pro HYROX" },
  { value: "16:00", label: "5K" },
  { value: "9:23", label: "HYROX improvement" },
  /** Replace with real coached-athlete count when confirmed. */
  { value: "—", label: "Athletes coached", placeholder: true },
] as const;

export const FOUNDER_TRANSFORMATION = {
  from: "1:08:37",
  to: "59:14",
  label: "Pro Solo",
} as const;

/** Real asset — do not AI-generate or alter. */
export const FOUNDER_HERO_IMAGE = {
  src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Hyrox-Result-R5XsPC5ykZ8N8EakOwwdA56ysU9qyD.jpg",
  alt: "Kieran Higgs — HYROX Pro finish, Hybrid365 founder",
} as const;

export const FOUNDER_STORY_IMAGE = {
  src: "/images/hyrox-team/Hyrox-Result.jpg",
  alt: "Kieran Higgs celebrating sub-60 HYROX finish",
} as const;
