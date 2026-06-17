// YouTube Live 임베드 유틸.
// 라이브 방송도 일반 영상과 동일하게 https://www.youtube.com/embed/VIDEO_ID 로 임베드.

// 입력 허용:
//   https://www.youtube.com/watch?v=VIDEO_ID
//   https://youtu.be/VIDEO_ID
//   https://www.youtube.com/live/VIDEO_ID
//   https://www.youtube.com/embed/VIDEO_ID
//   bare VIDEO_ID (11자)
export function parseYouTubeId(input) {
  if (!input) return null;
  const s = String(input).trim();
  if (/^[\w-]{11}$/.test(s)) return s; // 11자 raw id
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const i = parts.findIndex((p) => p === "live" || p === "embed");
      if (i >= 0 && parts[i + 1] && /^[\w-]{11}$/.test(parts[i + 1])) {
        return parts[i + 1];
      }
    }
  } catch {
    /* URL 아님 */
  }
  return null;
}

export function buildEmbedUrl(videoId, { autoplay = true, mute = true } = {}) {
  if (!videoId) return null;
  const params = new URLSearchParams();
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", mute ? "1" : "0"); // autoplay 는 mute 일 때만 동작
  }
  params.set("playsinline", "1"); // 모바일 인라인 재생
  params.set("rel", "0");
  const qs = params.toString();
  return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ""}`;
}
