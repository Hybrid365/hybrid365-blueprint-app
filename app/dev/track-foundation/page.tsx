import TrackFoundationPreview from "@/components/track-foundation/TrackFoundationPreview";

export default async function TrackFoundationPage({
  searchParams,
}: {
  searchParams: Promise<{ fixture?: string; screen?: string }>;
}) {
  const params = await searchParams;
  return <TrackFoundationPreview initialFixture={params.fixture ?? null} initialScreen={params.screen ?? null} />;
}
