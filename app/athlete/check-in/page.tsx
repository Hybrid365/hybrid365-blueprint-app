import type { Metadata } from "next";
import CheckInPageClient from "./CheckInPageClient";

export const metadata: Metadata = {
  title: "Check-In | Hyrox Team Athlete",
};

export default function AthleteCheckInPage() {
  return <CheckInPageClient />;
}
