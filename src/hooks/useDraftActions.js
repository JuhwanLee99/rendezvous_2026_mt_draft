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
import { normalizeGameDateTime } from "../lib/gameDateTime.js";
import { parseYouTubeId } from "../lib/youtube.js";
import {
  availByPosFrom,
  emptyPosCount,
  findNextPicker,
  teamTotalPicks,
} from "../lib/draftEngine.js";
import { POSITION_CAP, STATUS, TEAM, pickDocId } from "../lib/constants.js";

const stateRef = () => doc(db, "draft", "state");
const secretsRef = () => doc(db, "draft", "secrets");

const DEFAULT_STATE = {
  status: STATUS.SETUP,
  firstPick: TEAM.A,
  pickCount: 0,
  poolSize: 0,
  slotIndex: 0,
  currentRound: 0,
  currentPicker: null,
  positions: [],
  posCount: { A: {}, B: {} },
  availByPos: {},
  gameDateTime: "",
  youtubeVideoId: null,
  teamA: { name: "", captainName: "" },
  teamB: { name: "", captainName: "" },
};

export function useDraftActions() {
  const ensureDraft = useCallback(async () => {
    const snap = await getDoc(stateRef());
    if (!snap.exists()) {
      await setDoc(stateRef(), { ...DEFAULT_STATE, updatedAt: serverTimestamp() });
    }
  }, []);

  // 팀/대표/선픽/포지션/유튜브 설정 (setup 단계)
  const saveConfig = useCallback(
    async ({ teamA, teamB, firstPick, gameDateTime, youtube, positions }) => {
      await ensureDraft();
      const patch = { updatedAt: serverTimestamp() };
      if (teamA) patch.teamA = teamA;
      if (teamB) patch.teamB = teamB;
      if (firstPick) patch.firstPick = firstPick;
      if (positions) patch.positions = positions;
      if (gameDateTime !== undefined)
        patch.gameDateTime = normalizeGameDateTime(gameDateTime);
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

  const setPins = useCallback(async ({ pinA, pinB }) => {
    const patch = {};
    if (pinA) patch.pinHashA = await sha256Hex(pinA);
    if (pinB) patch.pinHashB = await sha256Hex(pinB);
    await setDoc(secretsRef(), patch, { merge: true });
  }, []);

  // 선수 풀 전체 교체 (setup). players: [{ name, position }]
  const setPlayers = useCallback(async (players) => {
    const clean = players
      .map((p) => ({ name: (p.name || "").trim(), position: (p.position || "").trim() }))
      .filter((p) => p.name);
    const existing = await getDocs(collection(db, "players"));
    const batch = writeBatch(db);
    existing.forEach((d) => batch.delete(d.ref));
    clean.forEach((p, i) => {
      const ref = doc(collection(db, "players"));
      batch.set(ref, {
        name: p.name,
        position: p.position,
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
    const positions = s.positions || [];
    if (positions.length === 0)
      throw new Error("포지션 목록을 먼저 등록하세요.");
    if (!s.teamA?.name || !s.teamB?.name)
      throw new Error("양 팀 이름을 먼저 입력하세요.");

    const playersSnap = await getDocs(collection(db, "players"));
    const players = playersSnap.docs.map((d) => d.data());
    if (players.length < 2) throw new Error("선수가 2명 이상이어야 합니다.");
    const bad = players.filter((p) => !positions.includes(p.position));
    if (bad.length)
      throw new Error(
        `포지션이 비었거나 목록에 없는 선수: ${bad.map((p) => p.name).join(", ")}`,
      );

    const availByPos = availByPosFrom(players, positions);
    const posCount = emptyPosCount(positions);
    const first = findNextPicker(0, s.firstPick || TEAM.A, positions, availByPos, posCount);
    if (!first) throw new Error("시작할 수 있는 픽이 없습니다. (선수/포지션 확인)");

    await updateDoc(stateRef(), {
      status: STATUS.LIVE,
      pickCount: 0,
      poolSize: players.length,
      slotIndex: first.slotIndex,
      currentRound: first.currentRound,
      currentPicker: first.currentPicker,
      posCount,
      availByPos,
      updatedAt: serverTimestamp(),
    });
  }, []);

  // 픽 (대표: 본인 팀 / 관리자 대리: 현재 차례 팀)
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
      if (s.currentPicker !== claimingTeam) throw new Error("현재 차례가 아닙니다.");

      const team = claimingTeam;
      const pos = p.position;
      const have = s.posCount?.[team]?.[pos] || 0;
      if (have >= POSITION_CAP)
        throw new Error(`이미 ${pos} 포지션을 ${POSITION_CAP}명 채웠습니다.`);

      const overallIndex = s.pickCount;
      const pickRef = doc(db, "picks", pickDocId(overallIndex));
      if ((await tx.get(pickRef)).exists()) throw new Error("이미 처리된 픽입니다.");

      const newPosCount = {
        ...s.posCount,
        [team]: { ...s.posCount[team], [pos]: have + 1 },
      };
      const newAvail = { ...s.availByPos, [pos]: (s.availByPos[pos] || 0) - 1 };
      const teamPickIndex = teamTotalPicks(team, s.posCount); // 증가 전 누적
      const next = findNextPicker(
        s.slotIndex + 1,
        s.firstPick,
        s.positions,
        newAvail,
        newPosCount,
      );
      const complete = !next;

      tx.update(pRef, { status: "picked", pickedBy: team, pickIndex: overallIndex });
      tx.set(pickRef, {
        index: overallIndex,
        slotIndex: s.slotIndex,
        round: s.currentRound,
        team,
        position: pos,
        teamPickIndex,
        playerId,
        playerName: p.name,
        pickedByUid: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      });
      tx.update(sRef, {
        pickCount: overallIndex + 1,
        posCount: newPosCount,
        availByPos: newAvail,
        slotIndex: complete ? s.slotIndex : next.slotIndex,
        currentRound: complete ? s.currentRound : next.currentRound,
        currentPicker: complete ? null : next.currentPicker,
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

      const team = last.team;
      const pos = last.position;
      const newPosCount = {
        ...s.posCount,
        [team]: {
          ...s.posCount[team],
          [pos]: Math.max(0, (s.posCount?.[team]?.[pos] || 0) - 1),
        },
      };
      const newAvail = { ...s.availByPos, [pos]: (s.availByPos[pos] || 0) + 1 };

      if (playerSnap.exists()) {
        tx.update(playerRef, { status: "available", pickedBy: null, pickIndex: null });
      }
      tx.delete(pickRef);
      tx.update(sRef, {
        pickCount: lastIndex,
        posCount: newPosCount,
        availByPos: newAvail,
        slotIndex: last.slotIndex,
        currentRound: last.round,
        currentPicker: last.team,
        status: STATUS.LIVE,
        updatedAt: serverTimestamp(),
      });
    });
  }, []);

  // 관리자: 전체 리셋
  const resetDraft = useCallback(async () => {
    const sSnap = await getDoc(stateRef());
    const positions = sSnap.exists() ? sSnap.data().positions || [] : [];
    const picksSnap = await getDocs(collection(db, "picks"));
    const playersSnap = await getDocs(collection(db, "players"));
    const batch = writeBatch(db);
    picksSnap.forEach((d) => batch.delete(d.ref));
    playersSnap.forEach((d) =>
      batch.update(d.ref, { status: "available", pickedBy: null, pickIndex: null }),
    );
    const allAvailable = playersSnap.docs.map((d) => ({
      position: d.data().position,
      status: "available",
    }));
    batch.update(stateRef(), {
      status: STATUS.SETUP,
      pickCount: 0,
      slotIndex: 0,
      currentRound: 0,
      currentPicker: null,
      posCount: emptyPosCount(positions),
      availByPos: availByPosFrom(allAvailable, positions),
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

// 선택한 팀의 PIN(4자리) 검증.
export async function verifyTeamPin(pin, team, secrets) {
  if (!secrets) return false;
  const h = await sha256Hex(pin);
  const target = team === TEAM.A ? secrets.pinHashA : secrets.pinHashB;
  return !!target && h === target;
}
