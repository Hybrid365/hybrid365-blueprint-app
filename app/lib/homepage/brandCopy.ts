/** Homepage brand messaging — identity-first. Edit copy here. */

export const BRAND_MOTTO = "Refuse average." as const;

export const BRAND_TAGLINE_LINES = [
  "Run fast",
  "Lift heavy",
  "Look athletic",
  "Perform better",
] as const;

export const BRAND_TAGLINE =
  "Run fast. Lift heavy. Look athletic. Perform better." as const;

export const HERO_STATS = [
  { value: "59:14", label: "Pro HYROX" },
  { value: "16:00", label: "5K" },
  { value: "9:23", label: "HYROX improvement" },
  { value: "7+", label: "Athletes coached" },
] as const;

export const HERO_SUPPORTING_COPY =
  "You already work harder than most. Now give that work a system." as const;

export const HERO_PROOF_COPY =
  "Built for athletes who refuse average — not another motivational feed." as const;

/** Primary proof band — immediately below hero */
export const PRIMARY_PROOF_METRICS = [
  { value: "1:08:37", label: "Start" },
  { value: "59:14", label: "Pro HYROX", accent: true },
  { value: "9:23", label: "Improvement" },
  { value: "16:00", label: "5K PB" },
] as const;

export const PRIMARY_PROOF_BODY =
  "From 1:08:37 to 59:14 Pro Solo HYROX. Threshold progression, run volume, body composition and benchmarks—not guesswork." as const;

export const IDENTITY_HEADLINE = {
  line1: "You already work hard.",
  line2: "Now make it count.",
} as const;

export const IDENTITY_BODY =
  "Hybrid365 isn't built for people looking for motivation. It's built for athletes who already train consistently and now want structure, progression and accountability." as const;

/** @deprecated Use IDENTITY_HEADLINE */
export const BELIEF_HEADLINE = IDENTITY_HEADLINE;

/** @deprecated Use IDENTITY_BODY */
export const BELIEF_BODY = IDENTITY_BODY;

export const STANDARD_HEADLINE = {
  eyebrow: "The standard",
  line1: "Quiet confidence.",
  line2: "Earned standards.",
} as const;

export const STANDARD_BODY =
  "Hybrid365 isn't a vibe. It's a team of people who train when motivation disappears — and hold each other to a higher bar." as const;

export const SYSTEM_HEADLINE = {
  eyebrow: "The coaching system",
  line1: "Your programme.",
  line2: "Your progress.",
} as const;

export const SYSTEM_BODY =
  "Programme, check-ins, benchmarks, progress and sessions — one place where your coaching actually lives." as const;

export const HOW_IT_WORKS_STEPS = [
  { id: "apply", step: "01", title: "Apply", body: "Tell us where you are and where you're going." },
  { id: "programme", step: "02", title: "Receive Programme", body: "Structured training built around your goals and schedule." },
  { id: "train", step: "03", title: "Train + Check-in", body: "Execute sessions. Log effort. Stay accountable weekly." },
  { id: "progress", step: "04", title: "Progress", body: "Benchmarks, trends and coach feedback — measured, not guessed." },
] as const;

export const RESULTS_HEADLINE = {
  eyebrow: "The results",
  line1: "Proof compounds.",
  line2: "Progress measured.",
} as const;

export const RESULTS_BODY = PRIMARY_PROOF_BODY;

export const CULTURE_HEADLINE = "For people who refuse average." as const;

export const CULTURE_BODY =
  "This isn't coaching in isolation. It's a community built on performance, consistency and shared standards." as const;

export const COMMUNITY_CRITERIA = [
  "Train when motivation disappears",
  "Care about performance — not just participation",
  "Refuse average as a default",
  "Value consistency over hype",
  "Want coaching — not guesswork",
  "Want people around them with the same standards",
] as const;

export const CULTURE_TRAITS = COMMUNITY_CRITERIA;

export const FINAL_CTA_HEADLINE = {
  line1: "Your hard work",
  line2: "deserves a system.",
} as const;

export const FINAL_CTA_BODY =
  "Choose your priority. Share your starting point. See how Hybrid365 would structure your week." as const;

/** Founder proof progression — single source, no hero duplication */
export const FOUNDER_PROOF_PROGRESSION = [
  { value: "1:08:37", label: "Start" },
  { value: "59:14", label: "Pro HYROX", accent: true },
  { value: "9:23", label: "Improvement" },
] as const;

export const FOUNDER_PROOF_SECONDARY = { value: "16:00", label: "5K PB" } as const;

export const PROOF_MARQUEE_ITEMS = [
  { value: "Refuse", label: "Average" },
  { value: "59:14", label: "Pro HYROX" },
  { value: "16:00", label: "5K PB" },
  { value: "9:23", label: "HYROX improvement" },
  { value: "Structure", label: "Not guesswork" },
  { value: "Hybrid365", label: "Team standard" },
] as const;
