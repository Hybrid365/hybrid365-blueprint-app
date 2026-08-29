import { getPhoneScreen } from "@/app/lib/homepage/phoneScreens";
import { START_PLATFORM_PREVIEWS } from "@/app/lib/start/startCopy";
import { HomepagePhoneVisual } from "@/components/homepage/HomepagePhoneVisual";

export function StartPlatformHint() {
  const [programme, sessions, progress] = START_PLATFORM_PREVIEWS;
  const screens = {
    programme: getPhoneScreen(programme.id),
    sessions: getPhoneScreen(sessions.id),
    progress: getPhoneScreen(progress.id),
  };

  return (
    <div className="mt-2.5 sm:mt-4">
      <div className="relative mx-auto h-[148px] max-w-[320px] sm:h-[220px] sm:max-w-[420px] lg:h-[280px] lg:max-w-[560px]">
        <div className="absolute left-[2%] top-[22%] z-0 w-[24%] -rotate-[5deg] opacity-45 sm:top-[14%] sm:w-[28%] sm:opacity-60 lg:left-[4%]">
          <HomepagePhoneVisual
            screen={screens.sessions}
            displayWidth={160}
            fillContainer
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.4)]"
          />
        </div>
        <div className="absolute right-[2%] top-[22%] z-0 w-[24%] rotate-[5deg] opacity-45 sm:top-[14%] sm:w-[28%] sm:opacity-60 lg:right-[4%]">
          <HomepagePhoneVisual
            screen={screens.progress}
            displayWidth={160}
            fillContainer
            className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.4)]"
          />
        </div>
        <div className="absolute left-1/2 top-0 z-10 w-[42%] -translate-x-1/2 sm:w-[40%] lg:w-[36%]">
          <HomepagePhoneVisual
            screen={screens.programme}
            displayWidth={220}
            fillContainer
            priority
            className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.55)]"
          />
        </div>
        <ul className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-3 gap-2">
          {[sessions, programme, progress].map((item) => (
            <li
              key={item.id}
              className="text-center text-[7px] font-bold uppercase tracking-[0.14em] text-white/32 sm:text-[9px]"
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
