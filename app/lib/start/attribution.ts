/** Preserve existing campaign params when moving between marketing routes. */

export const ATTRIBUTION_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
] as const;

type SearchReader = { get(name: string): string | null };

export function appendAttributionQuery(
  href: string,
  source: SearchReader | URLSearchParams | null | undefined
): string {
  if (!href || !source) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return href;
  }

  try {
    const isAbsolute = /^https?:\/\//i.test(href);
    const url = isAbsolute ? new URL(href) : new URL(href, "https://hybrid365.local");
    let added = false;

    for (const key of ATTRIBUTION_QUERY_KEYS) {
      const value = source.get(key)?.trim();
      if (!value || url.searchParams.has(key)) continue;
      url.searchParams.set(key, value);
      added = true;
    }

    if (!added) return href;
    if (isAbsolute) return url.toString();
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}
