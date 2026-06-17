import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { TEAM } from "../lib/constants.js";

// draft/state + players + picks 실시간 구독 + 파생값.
export function useDraft() {
  const [draft, setDraft] = useState(null);
  const [draftExists, setDraftExists] = useState(false);
  const [players, setPlayers] = useState([]);
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubDraft = onSnapshot(
      doc(db, "draft", "state"),
      (snap) => {
        setDraft(snap.exists() ? snap.data() : null);
        setDraftExists(snap.exists());
        setLoading(false);
      },
      (err) => {
        // 보안 규칙 미배포/권한 거부 등 → 무한 스피너 대신 진행 + 콘솔에 원인 노출
        console.error(
          "draft 구독 오류 (Firestore 규칙을 배포했는지 확인하세요):",
          err,
        );
        setLoading(false);
      },
    );
    const unsubPlayers = onSnapshot(
      query(collection(db, "players"), orderBy("order")),
      (snap) => setPlayers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("players 구독 오류:", err),
    );
    const unsubPicks = onSnapshot(
      query(collection(db, "picks"), orderBy("index")),
      (snap) => setPicks(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("picks 구독 오류:", err),
    );
    return () => {
      unsubDraft();
      unsubPlayers();
      unsubPicks();
    };
  }, []);

  const derived = useMemo(() => {
    const availablePlayers = players.filter((p) => p.status !== "picked");
    const rosterByTeam = {
      [TEAM.A]: picks.filter((p) => p.team === TEAM.A),
      [TEAM.B]: picks.filter((p) => p.team === TEAM.B),
    };
    return {
      availablePlayers,
      rosterByTeam,
      currentPicker: draft?.currentPicker ?? null,
      currentRound: draft?.currentRound ?? 0,
      status: draft?.status ?? "setup",
      pickCount: draft?.pickCount ?? 0,
      poolSize: draft?.poolSize ?? players.length,
    };
  }, [players, picks, draft]);

  return { draft, draftExists, players, picks, loading, ...derived };
}

// 픽 목록을 라운드별로 그룹핑 (로스터 표시용)
export function groupByRound(picks) {
  const map = new Map();
  for (const p of picks) {
    if (!map.has(p.round)) map.set(p.round, []);
    map.get(p.round).push(p);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]); // [[round, picks[]], ...]
}
