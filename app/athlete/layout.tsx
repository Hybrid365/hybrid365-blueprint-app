import { AthletePortalProvider } from "@/components/athlete-command-centre/athletePortalContext";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return <AthletePortalProvider>{children}</AthletePortalProvider>;
}
