import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAthleteVisualReviewPreviewAllowed } from "@/app/lib/previewAthleteVisualReviewGuard";
import { HomeDVisualReview } from "@/components/athlete-command-centre/visual-system/preview/HomeDVisualReview";
import { parseHomeDVisualReviewState } from "@/components/athlete-command-centre/visual-system/preview/homeDVisualReviewFixtures";

export const metadata: Metadata = {
  title: "Home D visual review",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams?: Promise<{ state?: string }> | { state?: string };
};

export default async function PreviewAthleteHomePage({ searchParams }: PageProps) {
  if (!isAthleteVisualReviewPreviewAllowed()) notFound();

  const params = searchParams instanceof Promise ? await searchParams : searchParams;
  const initialState = parseHomeDVisualReviewState(params?.state);

  return <HomeDVisualReview initialState={initialState} />;
}
