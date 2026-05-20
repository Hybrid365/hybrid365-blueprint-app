import { YouTubeEmbed, HYROX_TEAM_TRAILER_VIDEO_ID } from "./YouTubeEmbed";

function WatchThisFirstCallout() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center rounded-full border border-[#f4d23c]/35 bg-[#f4d23c]/[0.08] px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-[#f4d23c] shadow-[0_0_24px_rgba(244,210,60,0.12)]">
        Watch this first
      </span>
      <svg
        className="h-7 w-7 shrink-0 text-[#f4d23c]/75 rotate-90 sm:rotate-[125deg] sm:translate-y-0.5"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M5 12h12M15 8l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Hero trailer column: YouTube embed + stats strip (Hyrox Team landing). */
export function HyroxTeamHeroTrailer() {
  return (
    <div className="rounded-[24px] sm:rounded-[32px] border border-white/[0.14] overflow-hidden bg-[#0b0b0b] shadow-[0_28px_90px_rgba(0,0,0,0.5)]">
      <div className="border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent px-4 py-4 sm:px-5 sm:py-5">
        <WatchThisFirstCallout />
        <p className="m-0 mt-3 max-w-md text-sm leading-relaxed text-[#a9a9a9]">
          Before you apply, watch how the Hybrid365 Hyrox Team works.
        </p>
      </div>

      <div className="relative p-3 sm:p-4">
        <div className="overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_0_0_1px_rgba(244,210,60,0.08),0_20px_50px_rgba(0,0,0,0.45),0_0_40px_rgba(244,210,60,0.06)]">
          <YouTubeEmbed
            videoId={HYROX_TEAM_TRAILER_VIDEO_ID}
            title="Hybrid365 Hyrox Team trailer"
            className="rounded-2xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.08]">
        <div className="bg-[#0d0d0d] p-[18px]">
          <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
            5-6
          </strong>
          <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
            Selected athletes
          </small>
        </div>
        <div className="bg-[#0d0d0d] p-[18px]">
          <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
            1-1
          </strong>
          <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
            Programming
          </small>
        </div>
        <div className="bg-[#0d0d0d] p-[18px]">
          <strong className="block text-[#f4d23c] text-[28px] leading-none mb-1.5 tracking-[-0.05em]">
            Race
          </strong>
          <small className="text-[#a9a9a9] uppercase text-[11px] font-black tracking-[0.09em]">
            Documented build
          </small>
        </div>
      </div>
    </div>
  );
}
