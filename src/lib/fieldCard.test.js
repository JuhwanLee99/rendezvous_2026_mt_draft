import { describe, expect, it } from "vitest";
import { getFieldGeometry } from "./fieldCard.js";

function dotAt(origin, a, b) {
  return (a.x - origin.x) * (b.x - origin.x)
    + (a.y - origin.y) * (b.y - origin.y);
}

describe("getFieldGeometry", () => {
  it.each([
    [84, 260, 912, 650],
    [84, 260, 912, 1010],
  ])("이미지 비율과 무관하게 파울라인과 베이스 라인을 직각으로 그린다", (fx, fy, fw, fh) => {
    const { home, leftFoul, rightFoul, first, second, third } = getFieldGeometry(fx, fy, fw, fh);

    expect(dotAt(home, leftFoul, rightFoul)).toBeCloseTo(0, 8);
    expect(dotAt(second, first, third)).toBeCloseTo(0, 8);
  });
});
