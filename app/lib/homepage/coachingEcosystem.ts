/** Homepage-only coaching ecosystem hero visual — card data and layout config. */

export type EcosystemAccent = "gold" | "green" | "blue" | "orange" | "purple";

export type EcosystemFeatureCard = {
  id: string;
  title: string;
  tags: readonly string[];
  accent: EcosystemAccent;
  /** Shown as floating card on mobile (max 4 around phone). */
  mobileFloat: boolean;
  /** Desktop absolute position classes (within ecosystem container). */
  desktopClass: string;
  /** Mobile absolute position when floating. */
  mobileClass: string;
  /** SVG connector path (viewBox 0 0 100 100) ending at card anchor. */
  connectorPath: string;
  connectorEnd: { x: number; y: number };
  /** Optional highlight line (e.g. metric or status). */
  highlight?: { label: string; value: string; tone?: "green" | "gold" };
};

export const ECOSYSTEM_ACCENT_STYLES: Record<
  EcosystemAccent,
  { dot: string; border: string; glow: string }
> = {
  gold: {
    dot: "bg-[#f4d23c]",
    border: "border-[#f4d23c]/20",
    glow: "shadow-[0_0_20px_rgba(244,210,60,0.08)]",
  },
  green: {
    dot: "bg-[#4ade80]",
    border: "border-[#4ade80]/20",
    glow: "shadow-[0_0_20px_rgba(74,222,128,0.08)]",
  },
  blue: {
    dot: "bg-[#60a5fa]",
    border: "border-[#60a5fa]/20",
    glow: "shadow-[0_0_20px_rgba(96,165,250,0.08)]",
  },
  orange: {
    dot: "bg-[#fb923c]",
    border: "border-[#fb923c]/20",
    glow: "shadow-[0_0_20px_rgba(251,146,60,0.08)]",
  },
  purple: {
    dot: "bg-[#a78bfa]",
    border: "border-[#a78bfa]/20",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.08)]",
  },
};

export const ECOSYSTEM_FEATURE_CARDS: EcosystemFeatureCard[] = [
  {
    id: "programme",
    title: "Structured Programme",
    tags: ["Daily sessions", "Coach notes", "Progressions"],
    accent: "gold",
    mobileFloat: true,
    desktopClass: "top-[4%] left-0 w-[38%] max-w-[132px]",
    mobileClass: "top-[2%] left-0 w-[42%] max-w-[118px]",
    connectorPath: "M50 50 C38 42 28 32 20 24",
    connectorEnd: { x: 20, y: 24 },
  },
  {
    id: "check-in",
    title: "Weekly Check-In",
    tags: ["Sleep", "Energy", "Soreness", "Bodyweight"],
    accent: "purple",
    mobileFloat: true,
    desktopClass: "top-[2%] right-0 w-[38%] max-w-[132px]",
    mobileClass: "top-[0%] right-0 w-[42%] max-w-[118px]",
    connectorPath: "M50 50 C62 40 72 30 80 22",
    connectorEnd: { x: 80, y: 22 },
  },
  {
    id: "performance",
    title: "Performance Tracking",
    tags: ["Run volume +35%", "Threshold +100%", "Race readiness 82%"],
    accent: "green",
    mobileFloat: true,
    desktopClass: "top-[38%] -left-[2%] w-[36%] max-w-[128px]",
    mobileClass: "top-[34%] -left-[1%] w-[40%] max-w-[112px]",
    connectorPath: "M50 50 C38 50 28 50 18 50",
    connectorEnd: { x: 18, y: 50 },
    highlight: { label: "Race readiness", value: "82%", tone: "gold" },
  },
  {
    id: "benchmark",
    title: "Benchmark Testing",
    tags: ["5K", "Threshold", "Strength", "HYROX"],
    accent: "blue",
    mobileFloat: false,
    desktopClass: "top-[36%] -right-[2%] w-[36%] max-w-[128px]",
    mobileClass: "",
    connectorPath: "M50 50 C62 50 72 50 82 50",
    connectorEnd: { x: 82, y: 50 },
  },
  {
    id: "coach",
    title: "Coach Feedback",
    tags: ["Next focus: Threshold pacing"],
    accent: "orange",
    mobileFloat: true,
    desktopClass: "bottom-[6%] left-[2%] w-[38%] max-w-[132px]",
    mobileClass: "bottom-[4%] left-0 w-[42%] max-w-[118px]",
    connectorPath: "M50 50 C40 60 30 70 22 78",
    connectorEnd: { x: 22, y: 78 },
    highlight: { label: "Status", value: "On Track", tone: "green" },
  },
  {
    id: "team",
    title: "Hybrid365 Team",
    tags: ["Standards", "Challenges", "Leaderboards"],
    accent: "gold",
    mobileFloat: false,
    desktopClass: "bottom-[4%] right-0 w-[38%] max-w-[132px]",
    mobileClass: "",
    connectorPath: "M50 50 C60 62 70 72 80 80",
    connectorEnd: { x: 80, y: 80 },
  },
];

export const HERO_ECOSYSTEM_PHONE = {
  screenId: "team-athlete-overview" as const,
  /** ~48–52% mobile viewport; downscale only from native ~440px asset. */
  displayWidth: { mobile: 188, tablet: 196, desktop: 204 },
} as const;
