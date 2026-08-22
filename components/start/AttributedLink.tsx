"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { appendAttributionQuery } from "@/app/lib/start/attribution";

function isInternalPath(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function AttributedLinkInner({
  href,
  className,
  children,
  target,
  rel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  const params = useSearchParams();
  const next = appendAttributionQuery(href, params);

  if (!isInternalPath(href) || href.startsWith("#")) {
    return (
      <a href={next} className={className} target={target} rel={rel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={next} className={className} target={target} rel={rel}>
      {children}
    </Link>
  );
}

/** Homepage / start conversion links — forwards UTM params when present. */
export function AttributedLink({
  href,
  className,
  children,
  target,
  rel,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
  rel?: string;
}) {
  return (
    <Suspense
      fallback={
        isInternalPath(href) && !href.startsWith("#") ? (
          <Link href={href} className={className} target={target} rel={rel}>
            {children}
          </Link>
        ) : (
          <a href={href} className={className} target={target} rel={rel}>
            {children}
          </a>
        )
      }
    >
      <AttributedLinkInner href={href} className={className} target={target} rel={rel}>
        {children}
      </AttributedLinkInner>
    </Suspense>
  );
}
