import type { Metadata } from "next";
import { StartExperience } from "@/components/start/StartExperience";
import { StartShell } from "@/components/start/StartShell";

export const metadata: Metadata = {
  title: "What are you training for?",
  description:
    "Choose your Hybrid365 coaching pathway. Hybrid Performance or HYROX — then pick Track or 1-1 support.",
};

export default function StartPage() {
  return (
    <StartShell showLogin>
      <StartExperience />
    </StartShell>
  );
}
