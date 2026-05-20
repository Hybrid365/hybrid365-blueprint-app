import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Flag,
  Home,
  MessageSquare,
  Target,
} from "lucide-react";

export type AthleteNavId =
  | "home"
  | "programme"
  | "progress"
  | "benchmarks"
  | "checkin"
  | "coach-notes"
  | "race-prep"
  | "resources";

export type AthleteNavItem = {
  id: AthleteNavId;
  label: string;
  href: string;
  icon: LucideIcon;
  mobilePrimary?: boolean;
  mobileMore?: boolean;
};

export const ATHLETE_NAV_ITEMS: AthleteNavItem[] = [
  { id: "home", label: "Home", href: "/athlete/dashboard", icon: Home, mobilePrimary: true },
  { id: "programme", label: "Programme", href: "/athlete/programme", icon: CalendarDays, mobilePrimary: true },
  { id: "progress", label: "Progress", href: "/athlete/progress", icon: Activity, mobilePrimary: true },
  { id: "benchmarks", label: "Benchmarks", href: "/athlete/benchmarks", icon: Target, mobileMore: true },
  { id: "checkin", label: "Check-In", href: "/athlete/check-in", icon: ClipboardCheck, mobilePrimary: true },
  { id: "coach-notes", label: "Coach Notes", href: "/athlete/coach-notes", icon: MessageSquare, mobileMore: true },
  { id: "race-prep", label: "Race Prep", href: "/athlete/race-prep", icon: Flag, mobileMore: true },
  { id: "resources", label: "Resources", href: "/athlete/resources", icon: BookOpen, mobileMore: true },
];

export const ATHLETE_DESKTOP_NAV = ATHLETE_NAV_ITEMS;
export const ATHLETE_MOBILE_PRIMARY = ATHLETE_NAV_ITEMS.filter((i) => i.mobilePrimary);
export const ATHLETE_MOBILE_MORE = ATHLETE_NAV_ITEMS.filter((i) => i.mobileMore);
