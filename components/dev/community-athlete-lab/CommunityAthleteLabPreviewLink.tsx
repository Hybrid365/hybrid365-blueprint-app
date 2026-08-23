"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentProps } from "react";
import { buildLabHref } from "@/app/lib/dev/community-athlete-lab/previewEntry";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function CommunityAthleteLabPreviewLink(props: Props) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <CommunityAthleteLabPreviewLinkInner {...props} />
    </Suspense>
  );
}

function CommunityAthleteLabPreviewLinkInner({ href, ...props }: Props) {
  const searchParams = useSearchParams();
  return <Link href={buildLabHref(href, new URLSearchParams(searchParams.toString()))} {...props} />;
}
