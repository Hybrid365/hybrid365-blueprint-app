/** Time-aware greeting using athlete IANA timezone when provided. */
export function timeAwareGreeting(timezone?: string): string {
  const now = new Date();
  let hour: number;
  if (timezone) {
    try {
      hour = Number(
        new Intl.DateTimeFormat("en-GB", {
          hour: "numeric",
          hour12: false,
          timeZone: timezone,
        }).format(now)
      );
    } catch {
      hour = now.getHours();
    }
  } else {
    hour = now.getHours();
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
