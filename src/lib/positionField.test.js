import { describe, it, expect } from "vitest";
import { resolveSlot, SLOTS } from "./positionField.js";

describe("resolveSlot — 한국어 표준 포지션", () => {
  const cases = {
    투수: "P", 포수: "C", "1루수": "1B", "2루수": "2B", "3루수": "3B",
    유격수: "SS", 좌익수: "LF", 중견수: "CF", 우익수: "RF", 지명타자: "DH",
    내야수: "INF", 외야수: "OF",
  };
  for (const [name, slot] of Object.entries(cases)) {
    it(`${name} → ${slot}`, () => expect(resolveSlot(name)).toBe(slot));
  }
});

describe("resolveSlot — 약어/영문/공백", () => {
  it("P/C/SS/LF 등 약어", () => {
    expect(resolveSlot("P")).toBe("P");
    expect(resolveSlot("ss")).toBe("SS");
    expect(resolveSlot("1B")).toBe("1B");
    expect(resolveSlot(" RF ")).toBe("RF");
  });
  it("인식 불가 → null", () => {
    expect(resolveSlot("감독")).toBeNull();
    expect(resolveSlot("")).toBeNull();
  });
});

describe("모든 슬롯에 좌표 존재", () => {
  it("resolveSlot 결과는 SLOTS 키에 포함", () => {
    for (const slot of ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH", "INF", "OF"]) {
      expect(SLOTS[slot]).toBeTruthy();
    }
  });
});
