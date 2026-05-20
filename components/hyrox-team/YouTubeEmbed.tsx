type YouTubeEmbedProps = {
  /** YouTube video ID (e.g. CnZLXozIW-4) */
  videoId: string;
  title?: string;
  className?: string;
};

const HYROX_TEAM_TRAILER_ID = "CnZLXozIW-4";

export const HYROX_TEAM_TRAILER_VIDEO_ID = HYROX_TEAM_TRAILER_ID;

export function youtubeEmbedSrc(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

/** Responsive 16:9 YouTube iframe embed. */
export function YouTubeEmbed({ videoId, title = "YouTube video", className = "" }: YouTubeEmbedProps) {
  return (
    <div className={`relative w-full aspect-video bg-black ${className}`.trim()}>
      <iframe
        src={youtubeEmbedSrc(videoId)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
