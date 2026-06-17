import { useCallback } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase.js";
import { sha256Hex } from "../lib/hash.js";
import { parseYouTubeId } from "../lib/youtube.js";
import { computeTurn, teamPicksBefore } from "../lib/draftEngine.js";
import { STATUS, TEAM, pickDocId } from "../lib/constants.js";

const stateRef = () => doc(db, "draft", "state");
const secretsRef = () => doc(db, "draft", "secrets");

const DEFAULT_STATE = {
  status: STATUS.SETUP,
  firstPick: TEAM.A,
  pickCount: 0,
  poolSize: 0,
  currentRound: 0,
  currentPicker: null,
  youtubeVideoId: null,
  teamA: { name: "", captainName: "" },
  teamB: { name: "", captainName: "" },
};

export function useDraftActions() {
  // 최초 진입 시 draft/state 문서 보장 (관리자)
  const ensureDraft = useCallback(async () => {
    const snap = await getDoc(stateRef());
    if (!snap.exists()) {
      await setDoc(stateRef(), {
        ...DEFAULT_STATE,
        updatedAt: serverTimestamp(),
      });
    }
  }, []);

  // 팀/대표/선픽/유튜브 설정 (setup 단계)
  const saveConfig = useCallback(
    async ({ teamA, teamB, firstPick, youtube }) => {
      await ensureDraft();
      const patch = { updatedAt: serverTimestamp() };
      if (teamA) patch.teamA = teamA;
      if (teamB) patch.teamB = teamB;
      if (firstPick) patch.firstPick = firstPick;
      if (youtube !== undefined)
        patch.youtubeVideoId = parseYouTubeId(youtube) || null;
      await updateDoc(stateRef(), patch);
    },
    [ensureDraft],
  );

  const setYouTube = useCallback(async (url) => {
    await updateDoc(stateRef(), {
      youtubeVideoId: parseYouTubeId(url) || null,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // PIN 해시 저장 (4자리). 둘 다 있을 때만 해당 필드 갱신.
  const setPins = useCallback(async ({ pinA, pinB }) => {
    const patch = {};
    if (pinA) patch.pinHashA = await sha256Hex(pinA);
    if (pinB) patch.pinHashB = await sha256Hex(pinB);
    await setDoc(secretsRef(), patch, { merge: true });
  }, []);

  // 선수 풀 전체 교체 (setup 단계). names: string[]
  const setPlayers = useCallback(async (names) => {
    const clean = names.map((n) => n.trim()).filter(Boolean);
    const existing = await getDocs(collection(db, "players"));
    const batch = writeBatch(db);
    existing.forEach((d) => batch.delete(d.ref));
    clean.forEach((name, i) => {
      const ref = doc(collection(db, "players"));
      batch.set(ref, {
        name,
        order: i,
        status: "available",
        pickedBy: null,
        pickIndex: null,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
  }, []);

  // 드래프트 시작 (setup → live)
  const startDraft = useCallback(async () => {
    const snap = await getDoc(stateRef());
    if (!snap.exists()) throw new Error("드래프트 설정이 없습니다.");
    const s = snap.data();
    const playersSnap = await getDocs(collection(db, "players"));
    const poolSize = playersSnap.size;
    if (poolSize < 2) throw new Error("선수가 2명 이상이어야 합니다.");
    if (!s.teamA?.name || !s.teamB?.name)
      throw new Error("양 팀 이름을 먼저 입력하세요.");
    const firstPick = s.firstPick || TEAM.A;
    await updateDoc(stateRef(), {
      status: STATUS.LIVE,
      pickCount: 0,
      poolSize,
      currentRound: 1,
      currentPicker: firstPick,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // 픽 (대표: claimingTeam = 본인 팀 / 관리자 대리: 현재 차례 팀)
  const makePick = useCallback(async (playerId, claimingTeam) => {
    await runTransaction(db, async (tx) => {
      const sRef = stateRef();
      const pRef = doc(db, "players", playerId);
      const sSnap = await tx.get(sRef);
      const pSnap = await tx.get(pRef);
      if (!sSnap.exists()) throw new Error("드래프트 상태 없음");
      if (!pSnap.exists()) throw new Error("선수 정보 없음");
      const s = sSnap.data();
      const p = pSnap.data();
      if (s.status !== STATUS.LIVE) throw new Error("드래프트 진행 중이 아닙니다.");
      if (p.status === "picked") throw new Error("이미 지명된 선수입니다.");
      const turn = computeTurn(s.pickCount, s.firstPick, s.poolSize);
      if (!turn) throw new Error("드래프트가 종료되었습니다.");
      if (turn.currentPicker !== claimingTeam)
        throw new Error("현재 차례가 아닙니다.");

      const overallIndex = s.pickCount;
      const pickRef = doc(db, "picks", pickDocId(overallIndex));
      const existing = await tx.get(pickRef);
      if (existing.exists()) throw new Error("이미 처리된 픽입니다.");

      const team = turn.currentPicker;
      const teamPickIndex = teamPicksBefore(overallIndex, s.firstPick, team);

      tx.update(pRef, {
        status: "picked",
        pickedBy: team,
        pickIndex: overallIndex,
      });
      tx.set(pickRef, {
        index: overallIndex,
        round: turn.currentRound,
        team,
        teamPickIndex,
        playerId,
        playerName: p.name,
        pickedByUid: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      });

      const nextPickCount = overallIndex + 1;
      const complete = nextPickCount >= s.poolSize;
      const nextTurn = complete
        ? null
        : computeTurn(nextPickCount, s.firstPick, s.poolSize);
      tx.update(sRef, {
        pickCount: nextPickCount,
        currentRound: complete ? turn.currentRound : nextTurn.currentRound,
        currentPicker: complete ? null : nextTurn.currentPicker,
        status: complete ? STATUS.DONE : STATUS.LIVE,
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

  // 관리자: 마지막 픽 되돌리기 (정확히 역순)
  const undoLastPick = useCallback(async () => {
    await runTransaction(db, async (tx) => {
      const sRef = stateRef();
      const sSnap = await tx.get(sRef);
      if (!sSnap.exists()) throw new Error("드래프트 상태 없음");
      const s = sSnap.data();
      if (s.pickCount <= 0) throw new Error("되돌릴 픽이 없습니다.");
      const lastIndex = s.pickCount - 1;
      const pickRef = doc(db, "picks", pickDocId(lastIndex));
      const pickSnap = await tx.get(pickRef);
      if (!pickSnap.exists()) throw new Error("픽 기록 없음");
      const last = pickSnap.data();
      const playerRef = doc(db, "players", last.playerId);
      const playerSnap = await tx.get(playerRef);

      if (playerSnap.exists()) {
        tx.update(playerRef, {
          status: "available",
          pickedBy: null,
          pickIndex: null,
        });
      }
      tx.delete(pickRef);
      const prevTurn = computeTurn(lastIndex, s.firstPick, s.poolSize);
      tx.update(sRef, {
        pickCount: lastIndex,
        currentRound: prevTurn.currentRound,
        currentPicker: prevTurn.currentPicker,
        status: STATUS.LIVE, // undo 하면 항상 진행중
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

  // 관리자: 전체 리셋 (picks 삭제 + 선수 복원 + setup 복귀)
  const resetDraft = useCallback(async () => {
    const picksSnap = await getDocs(collection(db, "picks"));
    const playersSnap = await getDocs(collection(db, "players"));
    const batch = writeBatch(db);
    picksSnap.forEach((d) => batch.delete(d.ref));
    playersSnap.forEach((d) =>
      batch.update(d.ref, {
        status: "available",
        pickedBy: null,
        pickIndex: null,
      }),
    );
    batch.update(stateRef(), {
      status: STATUS.SETUP,
      pickCount: 0,
      currentRound: 0,
      currentPicker: null,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  }, []);

  return {
    ensureDraft,
    saveConfig,
    setYouTube,
    setPins,
    setPlayers,
    startDraft,
    makePick,
    undoLastPick,
    resetDraft,
  };
}

// 선택한 팀의 PIN(4자리) 검증. 대표가 팀을 직접 고르므로 두 팀 핀이 같아도 모호함이 없다.
export async function verifyTeamPin(pin, team, secrets) {
  if (!secrets) return false;
  const h = await sha256Hex(pin);
  const target = team === TEAM.A ? secrets.pinHashA : secrets.pinHashB;
  return !!target && h === target;
}
