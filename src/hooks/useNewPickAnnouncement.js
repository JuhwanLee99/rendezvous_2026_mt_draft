import { useEffect, useRef, useState } from "react";

// picks 가 늘어나면 가장 최근 픽을 발표 팝업으로 노출.
// 최초 로드 시 ref 를 현재 최신 index 로 초기화 → 새로고침해도 과거 픽 오발사 안 함.
export function useNewPickAnnouncement(picks, { autoDismissMs = 4500 } = {}) {
  const [latestPick, setLatestPick] = useState(null);
  const seenMaxIndex = useRef(null);

  useEffect(() => {
    const maxIndex = picks.length
      ? Math.max(...picks.map((p) => p.index))
      : -1;

    if (seenMaxIndex.current === null) {
      // 첫 스냅샷: 기준선만 설정, 팝업 없음
      seenMaxIndex.current = maxIndex;
      return;
    }
    if (maxIndex > seenMaxIndex.current) {
      const fresh = picks.find((p) => p.index === maxIndex);
      seenMaxIndex.current = maxIndex;
      if (fresh) setLatestPick(fresh);
    } else if (maxIndex < seenMaxIndex.current) {
      // undo 등으로 줄어든 경우 기준선만 내림
      seenMaxIndex.current = maxIndex;
    }
  }, [picks]);

  useEffect(() => {
    if (!latestPick) return;
    const t = setTimeout(() => setLatestPick(null), autoDismissMs);
    return () => clearTimeout(t);
  }, [latestPick, autoDismissMs]);

  const dismiss = () => setLatestPick(null);
  return { latestPick, dismiss };
}
