import { MockBottomNav } from "@/components/hyrox-landing/mockup/MockScreenChrome";

type NavIcon = "home" | "programme" | "progress" | "checkin" | "team";

export function HomepagePhoneScreenShell({
  children,
  activeNav = "home",
}: {
  children: React.ReactNode;
  activeNav?: NavIcon;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="flex-1 overflow-hidden px-3 pb-1 pt-3">{children}</div>
      <MockBottomNav active={activeNav} />
    </div>
  );
}
