"use client";

import Link from "next/link";
import { Suspense, type ComponentProps } from "react";
import { buildLabHref } from "@/app/lib/dev/community-athlete-lab/previewEntry";
import { useLabAccessSearchParams } from "./CommunityAthleteLabAccessContext";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

export function CommunityAthleteLabPreviewLink(props: Props) {
  const { href, ...linkProps } = props;
  return (
    <Suspense fallback={<Link href={buildLabHref(href, new URLSearchParams())} {...linkProps} />}>
      <CommunityAthleteLabPreviewLinkInner {...props} />
    </Suspense>
  );
}

function CommunityAthleteLabPreviewLinkInner({ href, ...props }: Props) {
  return <Link href={buildLabHref(href, useLabAccessSearchParams())} {...props} />;
}
