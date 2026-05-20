import HyroxAthletesListClient from "./HyroxAthletesListClient";

export const metadata = {
  title: "Hyrox Team Athletes | Hybrid365 Coach",
  description: "Internal coach roster — review and publish athlete programmes.",
};

export default function HyroxAthletesPage() {
  return <HyroxAthletesListClient />;
}
