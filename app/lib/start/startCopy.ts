export const START_INTENT_COPY = {
  eyebrow: "HYBRID365",
  headline: "LET'S START WITH YOU.",
  body: "Tell us where you're at and where you want to go. We'll show you the best way to get there.",
  assessmentNoteTitle: "This isn't your full athlete assessment.",
  assessmentNoteBody:
    "Once you join Hybrid365, we'll complete a detailed athlete assessment and testing week to understand your current performance, establish your individual training targets and personalise your programme.",
  assessmentNoteClose: "For now, we just need a few details to point you in the right direction.",
  instagramHint: "So Kieran knows who he's speaking to if he reaches out.",
  goalPlaceholder: "Sub-70 HYROX, first race, improve running, qualify for Worlds...",
  firstHyroxLabel: "First HYROX / no PB yet",
  hasPbLabel: "I have a HYROX PB",
  pbPlaceholder: "e.g. 1:15",
  racePlaceholder: "e.g. London, March 2027",
  cta: "CONTINUE →",
  submitting: "Continuing…",
} as const;

export const START_COPY = {
  eyebrow: "HYBRID365 COACHING",
  headline: "HOW FAR DO YOU WANT TO TAKE IT?",
  body: "Both paths are personalised. Choose the level of coaching and team support you want around your training.",
  talkPrompt: "Not sure which option fits?",
  talkCta: "Talk to Kieran →",
} as const;

export const START_TRACK_OPTION = {
  label: "HYROX TRACK",
  headline: "PERSONALISED TRAINING",
  body: "For athletes who want a personalised HYROX training system built around their performance, with the structure, progression and tools to execute their training independently.",
  points: [
    "Detailed athlete assessment",
    "Individual testing / benchmark week",
    "Training targets based on your numbers",
    "Personalised HYROX programming",
    "Hybrid365 athlete dashboard",
    "Progress and benchmark tracking",
    "Weekly check-ins",
    "Community / team environment",
    "Training education and resources",
  ],
  cta: "EXPLORE HYROX TRACK",
  href: "/hyrox-community",
} as const;

export const START_TEAM_OPTION = {
  label: "HYROX TEAM",
  headline: "FULL COACHING EXPERIENCE",
  body: "For athletes who want to become part of the full Hybrid365 HYROX Team, with greater direct coaching, team training, technique development and individual support.",
  points: [
    "Everything within the personalised training system",
    "Direct 1-1 coach oversight",
    "Greater individual programme adaptation",
    "Weekly individual coaching / feedback",
    "Team training sessions",
    "In-person technique coaching",
    "Testing and benchmark sessions",
    "Nutrition support",
    "Race strategy and preparation",
    "Full HYROX Team environment",
  ],
  cta: "EXPLORE HYROX TEAM",
  href: "/hyrox-team",
} as const;

export const TALK_COPY = {
  eyebrow: "TALK TO KIERAN",
  headline: "NOT SURE WHICH OPTION FITS?",
  body: "Tell me where you're currently at and what you're working towards. I'll point you in the right direction.",
  cta: "SEND MY DETAILS",
  instagramHint: "So I know who I'm speaking to if I reach out.",
  successTitle: "THANKS — I'VE GOT IT.",
  successBody:
    "I'll take a look at where you're currently at and point you towards the Hybrid365 coaching option that makes the most sense.",
  successNote: "If your Instagram account is private, keep an eye on your message requests.",
  trackCta: "Explore HYROX Track",
  trackHref: "/hyrox-community",
  teamCta: "View HYROX Team",
  teamHref: "/hyrox-team",
} as const;
