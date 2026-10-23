import { notFound } from "next/navigation";
import { ActiveAthletePage } from "@/components/athlete-command-centre/ActiveAthletePage";
import { PageContent } from "@/components/athlete-command-centre/athleteUi";
import { VisualSystemLab } from "@/components/athlete-command-centre/visual/VisualSystemLab";

function visualLabAllowed() {
  return process.env.HYROX_ENV === "staging" || process.env.NODE_ENV === "development";
}

export default function AthleteVisualLabPage() {
  if (!visualLabAllowed()) notFound();

  return (
    <ActiveAthletePage>
      <PageContent width="wide">
        <VisualSystemLab />
      </PageContent>
    </ActiveAthletePage>
  );
}
