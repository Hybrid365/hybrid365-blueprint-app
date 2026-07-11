import type { Metadata } from "next";
import { HomepagePhoneScreenExportGrid } from "@/components/homepage/phone-screens/HomepagePhoneScreens";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Dev/export-only page for high-resolution phone screen captures. */
export default function HomepagePhoneExportPage() {
  return <HomepagePhoneScreenExportGrid />;
}
