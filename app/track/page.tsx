import TrackAthleteApp from "@/components/track/TrackAthleteApp";
import { loadCanary } from "@/app/lib/track-canary/model";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function TrackPage() {
  const view = await loadCanary();
  return <TrackAthleteApp view={view} />;
}
