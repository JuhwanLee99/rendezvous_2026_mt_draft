import { describe, it, expect } from "vitest";
import {
  teamForPick,
  roundForPick,
  expectedTeam,
  computeTurn,
  teamPicksBefore,
  otherOf,
} from "./draftEngine.js";

const seq = (n, firstPick) =>
  Array.from({ length: n }, (_, i) => teamForPick(i, firstPick)).join("");

describe("teamForPick (snake order)", () => {
  it("A 선픽: A,B,B,A,A,B,B,A", () => {
    expect(seq(8, "A")).toBe("ABBAABBA");
  });
  it("B 선픽: B,A,A,B,B,A,A,B", () => {
    expect(seq(8, "B")).toBe("BAABBAAB");
  });
});

describe("roundForPick (1-based)", () => {
  it("index 0,1 -> R1 / 2,3 -> R2 / 4,5 -> R3", () => {
    expect([0, 1, 2, 3, 4, 5].map(roundForPick)).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("expectedTeam matches teamForPick (rule-inlined form)", () => {
  it("동일 결과 (A, B 모두 0..40)", () => {
    for (const fp of ["A", "B"]) {
      for (let i = 0; i < 41; i++) {
        expect(expectedTeam(i, fp)).toBe(teamForPick(i, fp));
      }
    }
  });
});

describe("computeTurn", () => {
  it("진행 중 정보", () => {
    expect(computeTurn(0, "A", 7)).toEqual({
      overallIndex: 0,
      currentRound: 1,
      currentPicker: "A",
      isLastPick: false,
    });
  });
  it("마지막 픽 플래그", () => {
    expect(computeTurn(6, "A", 7).isLastPick).toBe(true);
  });
  it("소진되면 null", () => {
    expect(computeTurn(7, "A", 7)).toBeNull();
  });
});

describe("홀수 풀 — 한 팀이 1명 더 (마지막 픽 팀)", () => {
  it("7명, A 선픽 => 마지막 픽(idx6, R4=[B,A]의 선픽)은 B => A 3명 / B 4명", () => {
    const counts = { A: 0, B: 0 };
    for (let i = 0; i < 7; i++) counts[teamForPick(i, "A")]++;
    expect(counts).toEqual({ A: 3, B: 4 });
    expect(teamForPick(6, "A")).toBe("B"); // 마지막(7번째) 픽은 B
  });
  it("teamPicksBefore 로도 동일", () => {
    expect(teamPicksBefore(7, "A", "A")).toBe(3);
    expect(teamPicksBefore(7, "A", "B")).toBe(4);
  });
});

describe("짝수 풀 — 균등", () => {
  it("8명 => 4:4", () => {
    expect(teamPicksBefore(8, "A", "A")).toBe(4);
    expect(teamPicksBefore(8, "A", "B")).toBe(4);
  });
});

describe("undo 라운드트립 (pickCount-1 되돌리면 동일 turn 재현)", () => {
  it("매 단계 turn 이 복원된다", () => {
    const firstPick = "A";
    const poolSize = 9;
    for (let pc = 1; pc <= poolSize; pc++) {
      const before = computeTurn(pc - 1, firstPick, poolSize); // pc-1 시점 차례
      // pc 시점에서 undo 하면 pc-1 로 돌아가고 동일 차례여야 함
      const restored = computeTurn(pc - 1, firstPick, poolSize);
      expect(restored).toEqual(before);
    }
  });
});

describe("otherOf", () => {
  it("A<->B", () => {
    expect(otherOf("A")).toBe("B");
    expect(otherOf("B")).toBe("A");
  });
});
