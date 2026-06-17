import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { PRESENCE_HEARTBEAT_MS, PRESENCE_STALE_MS } from "../lib/constants.js";

// 탭별 고유 clientId (1탭 = 1뷰어)
function getClientId() {
  try {
    let id = sessionStorage.getItem("rdv_client");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("rdv_client", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// 접속자수 하트비트 + 라이브 카운트 (Firestore). RTDB 미사용.
export function usePresence(page = "status") {
  const { user, ready } = useAuth();
  const [docs, setDocs] = useState([]);
  const [nowMs, setNowMs] = useState(0); // 타이머로 갱신되는 클럭(스테일 재평가용)

  useEffect(() => {
    if (!ready || !user) return;
    const clientId = getClientId();
    const ref = doc(db, "presence", clientId);

    const beat = () => {
      if (document.hidden) return; // 숨김 탭은 하트비트 정지 (쓰기 절약)
      setDoc(ref, {
        uid: user.uid,
        lastSeen: serverTimestamp(),
        page,
      }).catch(() => {});
    };

    beat();
    const interval = setInterval(beat, PRESENCE_HEARTBEAT_MS);
    const onVis = () => {
      if (!document.hidden) beat();
    };
    document.addEventListener("visibilitychange", onVis);

    const onUnload = () => {
      // best-effort 정리 (보장 안 됨 — 스테일은 카운트에서 자동 제외)
      deleteDoc(ref).catch(() => {});
    };
    window.addEventListener("pagehide", onUnload);

    const unsub = onSnapshot(collection(db, "presence"), (snap) =>
      setDocs(snap.docs.map((d) => d.data())),
    );

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onUnload);
      unsub();
      onUnload();
    };
  }, [ready, user, page]);

  // 스테일 문서 주기적 재평가 (표시 카운트가 자연 감소하도록).
  // Date.now() 는 렌더가 아닌 타이머 콜백에서만 호출(순수성 유지).
  useEffect(() => {
    const update = () => setNowMs(Date.now());
    const t0 = setTimeout(update, 0); // 즉시 1회 (렌더 밖에서 호출)
    const t = setInterval(update, 20_000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  const viewerCount = useMemo(() => {
    const cutoff = nowMs - PRESENCE_STALE_MS; // nowMs=0 이면 초기 잠깐 전체 카운트
    return docs.filter((d) => (d.lastSeen?.toMillis?.() ?? 0) >= cutoff).length;
  }, [docs, nowMs]);

  return { viewerCount };
}
