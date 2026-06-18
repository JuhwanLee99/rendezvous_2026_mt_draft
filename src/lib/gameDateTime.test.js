import { describe, expect, it } from "vitest";
import { formatGameDateTime, normalizeGameDateTime } from "./gameDateTime.js";

describe("normalizeGameDateTime", () => {
  it("datetime-local 값을 분 단위 문자열로 정규화한다", () => {
    expect(normalizeGameDateTime("2026-06-20T14:30")).toBe("2026-06-20T14:30");
    expect(normalizeGameDateTime("2026-06-20T14:30:45")).toBe("2026-06-20T14:30");
  });

  it("존재하지 않는 날짜는 빈 문자열로 처리한다", () => {
    expect(normalizeGameDateTime("2026-02-30T14:30")).toBe("");
    expect(normalizeGameDateTime("")).toBe("");
  });
});

describe("formatGameDateTime", () => {
  it("날짜, 요일, 시간을 한국어 이미지용 문구로 만든다", () => {
    expect(formatGameDateTime("2026-06-20T14:30")).toBe("2026. 6. 20. (토) 오후 2:30");
    expect(formatGameDateTime("2026-06-21T09:05")).toBe("2026. 6. 21. (일) 오전 9:05");
  });
});
