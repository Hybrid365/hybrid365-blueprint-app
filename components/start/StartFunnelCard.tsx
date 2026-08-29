import { StartPlatformHint } from "./StartPlatformHint";
import { StartProofStrip } from "./StartProofStrip";
import { StartStepIndicator } from "./StartStepIndicator";

export function StartFunnelCard({
  step,
  children,
  showFooter = true,
}: {
  step: 1 | 2 | 3;
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <section className="px-4 pb-7 pt-1 sm:px-6 sm:pb-10">
      <div className="mx-auto w-full max-w-[560px] lg:max-w-[760px]">
        <StartStepIndicator current={step} />
        {children}
        {showFooter ? (
          <>
            <StartProofStrip />
            <StartPlatformHint />
          </>
        ) : null}
      </div>
    </section>
  );
}
