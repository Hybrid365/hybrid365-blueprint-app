import { isHyroxCoachCommandCentreEnabled } from "@/app/lib/hyroxCoachCommandCentreFlag";
import { isHyroxRaceIntelligenceEnabled } from "@/app/lib/hyroxRaceIntelligenceFlag";
import HyroxAthleteCoachClient from "./HyroxAthleteCoachClient";

export const metadata = {
  title: "Athlete Coach Dashboard | Hybrid365",
};

export default async function HyroxAthleteCoachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <HyroxAthleteCoachClient
      athleteId={id}
      commandCentreEnabled={isHyroxCoachCommandCentreEnabled({ id })}
      raceIntelligenceEnabled={isHyroxRaceIntelligenceEnabled({ id })}
    />
  );
}
