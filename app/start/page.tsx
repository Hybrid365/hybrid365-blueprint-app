import type { Metadata } from "next";
import { StartExperience } from "@/components/start/StartExperience";
import { StartShell } from "@/components/start/StartShell";

export const metadata: Metadata = {
  title: "Let's start with you",
  description:
    "Tell us where you're at and where you want to go. We'll show you the best Hybrid365 coaching path.",
};

export default function StartPage() {
  return (
    <StartShell>
      <StartExperience />
    </StartShell>
  );
}
