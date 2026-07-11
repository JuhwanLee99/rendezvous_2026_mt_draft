import { describe, expect, it } from "vitest";
import { parsePlayers, parsePositions, resolveRulePosition } from "./positionRules.js";

describe("parsePositions", () => {
  it("콤마 기반 포지션 목록을 정리한다", () => {
    expect(parsePositions(" 투수, 포수, 내야수, 외야수 ,, ")).toEqual([
      "투수",
      "포수",
      "내야수",
      "외야수",
    ]);
  });
});

describe("resolveRulePosition", () => {
  const broadPositions = ["투수", "포수", "내야수", "외야수", "지명타자"];

  it("세부 투수 라벨을 기존 투수 규칙으로 정규화한다", () => {
    expect(resolveRulePosition("선발투수", broadPositions)).toBe("투수");
    expect(resolveRulePosition("중계투수", broadPositions)).toBe("투수");
  });

  it("후보 라벨을 기존 내야/외야 규칙으로 정규화한다", () => {
    expect(resolveRulePosition("내야후보", broadPositions)).toBe("내야수");
    expect(resolveRulePosition("외야후보", broadPositions)).toBe("외야수");
  });

  it("세부 포지션이 포지션 목록에 있으면 그대로 사용한다", () => {
    const detailedPositions = ["선발투수", "중계투수", "내야후보", "외야후보"];
    expect(resolveRulePosition("선발투수", detailedPositions)).toBe("선발투수");
    expect(resolveRulePosition("외야후보", detailedPositions)).toBe("외야후보");
  });

  it("표준 세부 수비 위치도 큰 포지션 규칙으로 매핑할 수 있다", () => {
    expect(resolveRulePosition("유격수", broadPositions)).toBe("내야수");
    expect(resolveRulePosition("중견수", broadPositions)).toBe("외야수");
  });
});

describe("parsePlayers", () => {
  it("규칙용 포지션과 표시 라벨을 분리한다", () => {
    const players = parsePlayers(
      "임재현, 선발투수\n박재정, 중계투수\n양인혁, 내야후보",
      ["투수", "내야수"],
    );

    expect(players).toEqual([
      { name: "임재현", position: "투수", positionLabel: "선발투수" },
      { name: "박재정", position: "투수", positionLabel: "중계투수" },
      { name: "양인혁", position: "내야수", positionLabel: "내야후보" },
    ]);
  });
});
