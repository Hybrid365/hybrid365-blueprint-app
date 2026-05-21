export type DashboardRotatingMessage = {
  id: string;
  text: string;
  cta?: { label: string; href: string };
};

/** Coaching / accountability prompts — rotates every 2 calendar days (deterministic). */
export const DASHBOARD_ROTATING_MESSAGES: DashboardRotatingMessage[] = [
  {
    id: "log-session",
    text: "Track the work today. Log your session, RPE and notes.",
    cta: { label: "Open programme", href: "/dashboard/programme" },
  },
  {
    id: "telegram-proof",
    text: "Proof builds accountability. Post your session in Telegram or tag @kieranhiggsfit / @hybrid.365.",
    cta: { label: "Community", href: "https://plan.hybrid-365.com/community" },
  },
  {
    id: "easy-days",
    text: "Keep easy days easy — they protect your key sessions.",
    cta: { label: "View programme", href: "/dashboard/programme" },
  },
  {
    id: "habits",
    text: "Check your habits today. Small wins compound.",
    cta: { label: "Log habits", href: "/dashboard/habits" },
  },
  {
    id: "check-in",
    text: "Weekly check-in due? Submit it so your progress stays visible.",
    cta: { label: "Complete check-in", href: "/dashboard" },
  },
  {
    id: "home-screen",
    text: "Save Hybrid365 to your home screen for quicker access.",
    cta: { label: "Open dashboard", href: "/dashboard" },
  },
  {
    id: "honest-logging",
    text: "Log sessions honestly — RPE and notes help us calibrate your next block.",
    cta: { label: "Open programme", href: "/dashboard/programme" },
  },
  {
    id: "consistency",
    text: "Consistency beats motivation. Open the plan and execute today.",
    cta: { label: "Go to training", href: "/dashboard/programme" },
  },
];

/** Index advances every 2 days (UTC date serial / 2). */
export function getRotatingDashboardMessage(now = new Date()): DashboardRotatingMessage {
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const daySerial = Math.floor(utcMidnight / 86_400_000);
  const index = Math.floor(daySerial / 2) % DASHBOARD_ROTATING_MESSAGES.length;
  return DASHBOARD_ROTATING_MESSAGES[index]!;
}
