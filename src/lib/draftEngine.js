// 스네이크 드래프트 엔진 — 순수 함수 (클라이언트 / 유닛테스트 공유)
//
// 픽 순서(스네이크)는 종전과 동일. 단, 포지션별 제한(팀당 최대 N명)이 추가되어
// "차례인 팀이 더 고를 수 없으면 그 슬롯은 건너뛰고" 다음으로 픽 가능한 팀에게 넘어간다.
// 양 팀 모두 더 고를 수 없으면 드래프트 종료.
//
// 컨벤션: slotIndex = 0-based 스네이크 슬롯 번호.
//   - 1-based 라운드 = floor(slotIndex/2) + 1
//   - 홀수 라운드(R1,R3,...) = [선픽팀, 상대팀] / 짝수 라운드 = [상대팀, 선픽팀]
//   => A 선픽: A,B,B,A,A,B,B,A ...

import { POSITION_CAP } from "./constants.js";

export function otherOf(team) {
  return team === "A" ? "B" : "A";
}

// 스네이크 슬롯의 차례 팀
export function teamForPick(slotIndex, firstPick) {
  const other = otherOf(firstPick);
  const round1 = Math.floor(slotIndex / 2) + 1;
  const slot = slotIndex % 2;
  const order = round1 % 2 === 1 ? [firstPick, other] : [other, firstPick];
  return order[slot];
}

export function roundForPick(slotIndex) {
  return Math.floor(slotIndex / 2) + 1;
}

// 포지션별 0으로 초기화된 양 팀 카운터
export function emptyPosCount(positions) {
  const zero = () => Object.fromEntries(positions.map((p) => [p, 0]));
  return { A: zero(), B: zero() };
}

// 현재 available 선수들로 포지션별 잔여 인원 집계 (모든 포지션 키를 0으로 보장)
export function availByPosFrom(players, positions) {
  const a = Object.fromEntries(positions.map((p) => [p, 0]));
  for (const pl of players) {
    if (pl.status !== "picked" && a[pl.position] !== undefined) a[pl.position]++;
  }
  return a;
}

// 해당 팀이 지금 고를 수 있는 선수가 하나라도 있는지
// (잔여 인원 있는 포지션 중, 팀이 아직 cap 미만인 포지션이 존재)
export function teamCanPick(team, positions, availByPos, posCount, cap = POSITION_CAP) {
  return positions.some(
    (p) => (availByPos?.[p] || 0) > 0 && (posCount?.[team]?.[p] || 0) < cap,
  );
}

// fromSlot 부터 픽 가능한 팀이 나오는 첫 슬롯을 찾는다.
// 양 팀 모두 불가하면 null (= 드래프트 종료).
export function findNextPicker(
  fromSlot,
  firstPick,
  positions,
  availByPos,
  posCount,
  cap = POSITION_CAP,
) {
  const can = {
    A: teamCanPick("A", positions, availByPos, posCount, cap),
    B: teamCanPick("B", positions, availByPos, posCount, cap),
  };
  if (!can.A && !can.B) return null;
  let s = fromSlot;
  // 스네이크는 어떤 3연속 슬롯 안에 두 팀이 모두 등장 → 최대 몇 칸 안에 반드시 찾음
  for (let i = 0; i < 8; i++) {
    const t = teamForPick(s, firstPick);
    if (can[t]) {
      return { slotIndex: s, currentPicker: t, currentRound: roundForPick(s) };
    }
    s += 1;
  }
  return null;
}

// 팀의 누적 픽 수 (= 다음 픽의 teamPickIndex)
export function teamTotalPicks(team, posCount) {
  return Object.values(posCount?.[team] || {}).reduce((a, b) => a + b, 0);
}
