import { buildEmbedUrl } from "../../lib/youtube.js";

export default function YouTubeLivePane({ videoId }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-black shadow-sm">
      <div className="aspect-video w-full">
        {videoId ? (
          <iframe
            className="h-full w-full"
            src={buildEmbedUrl(videoId, { autoplay: true, mute: true })}
            title="드래프트 라이브"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-800 text-slate-400">
            <span className="text-3xl">📺</span>
            <p className="text-sm font-medium">방송 준비중</p>
          </div>
        )}
      </div>
    </section>
  );
}
