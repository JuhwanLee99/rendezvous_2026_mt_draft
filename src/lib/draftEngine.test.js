import { describe, it, expect } from "vitest";
import {
  teamForPick,
  roundForPick,
  otherOf,
  emptyPosCount,
  availByPosFrom,
  teamCanPick,
  findNextPicker,
  teamTotalPicks,
} from "./draftEngine.js";

const seq = (n, fp) =>
  Array.from({ length: n }, (_, i) => teamForPick(i, fp)).join("");

describe("teamForPick (snake order — 변경 없음)", () => {
  it("A 선픽: A,B,B,A,A,B,B,A", () => expect(seq(8, "A")).toBe("ABBAABBA"));
  it("B 선픽: B,A,A,B,B,A,A,B", () => expect(seq(8, "B")).toBe("BAABBAAB"));
});

describe("roundForPick", () => {
  it("0,1→R1 / 2,3→R2 / 4,5→R3", () =>
    expect([0, 1, 2, 3, 4, 5].map(roundForPick)).toEqual([1, 1, 2, 2, 3, 3]));
});

describe("emptyPosCount / availByPosFrom", () => {
  it("포지션별 0 초기화", () =>
    expect(emptyPosCount(["P", "C"])).toEqual({
      A: { P: 0, C: 0 },
      B: { P: 0, C: 0 },
    }));
  it("available 선수만 포지션별 집계", () => {
    const players = [
      { position: "P", status: "available" },
      { position: "P", status: "picked" },
      { position: "C", status: "available" },
      { position: "C", status: "available" },
    ];
    expect(availByPosFrom(players, ["P", "C", "OF"])).toEqual({
      P: 1,
      C: 2,
      OF: 0,
    });
  });
});

describe("teamCanPick", () => {
  const positions = ["P", "C"];
  it("잔여 있고 cap 미만이면 true", () =>
    expect(
      teamCanPick("A", positions, { P: 1, C: 0 }, emptyPosCount(positions)),
    ).toBe(true));
  it("모든 포지션이 잔여 0이면 false", () =>
    expect(
      teamCanPick("A", positions, { P: 0, C: 0 }, emptyPosCount(positions)),
    ).toBe(false));
  it("잔여 있어도 그 포지션 cap(2) 도달이면 false", () =>
    expect(
      teamCanPick(
        "A",
        positions,
        { P: 3, C: 0 },
        { A: { P: 2, C: 0 }, B: { P: 0, C: 0 } },
      ),
    ).toBe(false));
});

describe("findNextPicker — 캡 없을 때 스네이크 그대로", () => {
  const positions = ["P"];
  const avail = { P: 100 };
  const pc = emptyPosCount(positions);
  it("슬롯 0,1,2,3 → A,B,B,A", () => {
    expect(findNextPicker(0, "A", positions, avail, pc, 999).currentPicker).toBe("A");
    expect(findNextPicker(1, "A", positions, avail, pc, 999).currentPicker).toBe("B");
    expect(findNextPicker(2, "A", positions, avail, pc, 999).currentPicker).toBe("B");
    expect(findNextPicker(3, "A", positions, avail, pc, 999).currentPicker).toBe("A");
  });
});

describe("findNextPicker — 못 뽑는 팀 차례 스킵", () => {
  const positions = ["P", "C"];
  it("A가 전 포지션 cap 도달이면 A 슬롯(0)은 건너뛰고 B(1)에게", () => {
    const posCount = { A: { P: 2, C: 2 }, B: { P: 0, C: 0 } };
    const avail = { P: 1, C: 1 };
    const next = findNextPicker(0, "A", positions, avail, posCount);
    expect(next).toEqual({ slotIndex: 1, currentPicker: "B", currentRound: 1 });
  });
});

describe("findNextPicker — 종료 조건", () => {
  const positions = ["P", "C"];
  it("양 팀 모두 cap 도달 → null", () => {
    const posCount = { A: { P: 2, C: 2 }, B: { P: 2, C: 2 } };
    expect(findNextPicker(0, "A", positions, { P: 5, C: 5 }, posCount)).toBeNull();
  });
  it("잔여 선수 0 → null (전 선수 소진)", () => {
    expect(
      findNextPicker(0, "A", positions, { P: 0, C: 0 }, emptyPosCount(positions)),
    ).toBeNull();
  });
});

describe("전체 진행 시뮬레이션 (포지션 캡 적용)", () => {
  it("P 3명·C 1명, 양팀 cap2 → 정확히 4픽 후 종료 (P는 2+2 불가, 1명 미배정)", () => {
    // P 포지션 선수 3명, C 1명. 캡2.
    // 가능한 픽: 각 팀 P 최대2, C 최대2. 하지만 P는 3명뿐, C는 1명뿐.
    // 최종: P 2+? 사실 3명이라 한 팀2+다른팀1=3 소진, C 1명 → 누군가 1명. 총 4픽.
    const positions = ["P", "C"];
    let avail = { P: 3, C: 1 };
    let posCount = emptyPosCount(positions);
    let slot = 0;
    const order = [];
    let next = findNextPicker(slot, "A", positions, avail, posCount);
    let guard = 0;
    while (next && guard++ < 50) {
      const team = next.currentPicker;
      // 그 팀이 고를 수 있는 첫 포지션을 집어 픽 시뮬레이션
      const pos = positions.find(
        (p) => avail[p] > 0 && posCount[team][p] < 2,
      );
      posCount[team][pos] += 1;
      avail[pos] -= 1;
      order.push(`${team}:${pos}`);
      next = findNextPicker(next.slotIndex + 1, "A", positions, avail, posCount);
    }
    // 총 4픽 (P 3 + C 1)
    expect(order.length).toBe(4);
    expect(avail).toEqual({ P: 0, C: 0 });
  });
});

describe("teamTotalPicks / otherOf", () => {
  it("팀 누적 픽 수", () =>
    expect(teamTotalPicks("A", { A: { P: 2, C: 1 }, B: { P: 0 } })).toBe(3));
  it("otherOf", () => {
    expect(otherOf("A")).toBe("B");
    expect(otherOf("B")).toBe("A");
  });
});
