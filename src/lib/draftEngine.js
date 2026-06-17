// 스네이크 드래프트 엔진 — 순수 함수 (클라이언트 / 보안규칙 / 유닛테스트 공유)
//
// 컨벤션(단일 통일): index 는 0-based 전체 픽 번호.
//   - 1-based 라운드 = floor(index/2) + 1
//   - 홀수 라운드(R1,R3,...) = [선픽팀, 상대팀]
//   - 짝수 라운드(R2,R4,...) = [상대팀, 선픽팀]
//   => A 선픽: A,B,B,A,A,B,B,A ...  (R1:A,B / R2:B,A / R3:A,B)
//
// firstPick: "A" | "B"

export function otherOf(team) {
  return team === "A" ? "B" : "A";
}

// 0-based 전체 픽 index 의 차례 팀
export function teamForPick(index, firstPick) {
  const other = otherOf(firstPick);
  const round1 = Math.floor(index / 2) + 1; // 1-based 라운드
  const slot = index % 2; // 0 = 선픽, 1 = 후픽
  const order = round1 % 2 === 1 ? [firstPick, other] : [other, firstPick];
  return order[slot];
}

// 0-based 전체 픽 index 의 1-based 라운드
export function roundForPick(index) {
  return Math.floor(index / 2) + 1;
}

// 보안 규칙에 인라인하는 것과 동일한 정수-모듈러 형태(검증용).
// round0(=floor(index/2)) 짝수 ⇔ index % 4 ∈ {0,1}
export function expectedTeam(index, firstPick) {
  const other = otherOf(firstPick);
  const slot = index % 2;
  const firstHalf = index % 4 < 2; // round0 짝수
  if (firstHalf) return slot === 0 ? firstPick : other;
  return slot === 0 ? other : firstPick;
}

// 현재 드래프트 상태에서 "다음에 픽할" 정보. 모두 소진되면 null.
export function computeTurn(pickCount, firstPick, poolSize) {
  if (pickCount >= poolSize) return null;
  return {
    overallIndex: pickCount,
    currentRound: roundForPick(pickCount),
    currentPicker: teamForPick(pickCount, firstPick),
    isLastPick: pickCount === poolSize - 1,
  };
}

// 한 팀이 특정 pickCount 시점까지 가진 픽 수 (해당 팀 로스터 슬롯 = teamPickIndex 계산용).
// pickCount 개의 픽 중 team 의 것 개수.
export function teamPicksBefore(pickCount, firstPick, team) {
  let n = 0;
  for (let i = 0; i < pickCount; i++) {
    if (teamForPick(i, firstPick) === team) n++;
  }
  return n;
}
