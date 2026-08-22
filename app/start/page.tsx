import type { Metadata } from "next";
import { StartSelector } from "@/components/start/StartSelector";
import { StartShell } from "@/components/start/StartShell";

export const metadata: Metadata = {
  title: "How far do you want to take it?",
  description:
    "Choose between Hybrid365 HYROX Track and HYROX Team. Both paths start with you — pick the level of coaching and team support you want around it.",
};

export default function StartPage() {
  return (
    <StartShell>
      <StartSelector />
    </StartShell>
  );
}
