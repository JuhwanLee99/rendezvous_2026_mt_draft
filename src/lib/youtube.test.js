import { describe, it, expect } from "vitest";
import { parseYouTubeId, buildEmbedUrl } from "./youtube.js";

describe("parseYouTubeId", () => {
  const ID = "dQw4w9WgXcQ";
  it("watch?v=", () => {
    expect(parseYouTubeId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });
  it("youtu.be", () => {
    expect(parseYouTubeId(`https://youtu.be/${ID}`)).toBe(ID);
  });
  it("/live/", () => {
    expect(parseYouTubeId(`https://www.youtube.com/live/${ID}`)).toBe(ID);
  });
  it("/embed/", () => {
    expect(parseYouTubeId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });
  it("raw 11자 id", () => {
    expect(parseYouTubeId(ID)).toBe(ID);
  });
  it("부가 쿼리 포함 watch", () => {
    expect(parseYouTubeId(`https://www.youtube.com/watch?v=${ID}&t=30s`)).toBe(ID);
  });
  it("잘못된 입력 -> null", () => {
    expect(parseYouTubeId("hello")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
    expect(parseYouTubeId(null)).toBeNull();
  });
});

describe("buildEmbedUrl", () => {
  it("기본: autoplay+mute", () => {
    const url = buildEmbedUrl("abc12345678");
    expect(url).toContain("https://www.youtube.com/embed/abc12345678?");
    expect(url).toContain("autoplay=1");
    expect(url).toContain("mute=1");
    expect(url).toContain("playsinline=1");
  });
  it("videoId 없으면 null", () => {
    expect(buildEmbedUrl(null)).toBeNull();
  });
});
