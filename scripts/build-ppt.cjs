const pptxgen = require("pptxgenjs");
const path = require("path");
const INTRO = path.join(__dirname, "..", "docs", "intro"); // 리포지토리 내 소개 자료 위치
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
p.author = "Rendezvous";
p.title = "Rendezvous 청백전 드래프트 — 기능 소개";

const W = 13.33, H = 7.5, M = 0.55;
const NAVY = "1E4B8E", NAVYD = "16386B", RED = "DA291C", ICE = "CFE0F5";
const INK = "1F2937", MUTED = "64748B", LINE = "E2E8F0", WHITE = "FFFFFF", BG = "F4F7FB";
const F = "Apple SD Gothic Neo";
const IMG = path.join(INTRO, "img") + "/";
const D = {
  "admin-setup.png": [2160, 2730], "admin-live.png": [1920, 959],
  "captain-team.png": [780, 1688], "captain-pin.png": [435, 894], "captain-yourturn.png": [416, 884],
  "captain-pick.png": [780, 2360], "captain-confirm.png": [423, 882],
  "status-pc-idle.png": [1920, 959], "status-mobile-live.png": [430, 895],
  "status-chat.png": [422, 359], "status-chat-cooldown.png": [478, 393],
  "export-field-1x1.png": [1080, 1080], "export-field-3x4.png": [1080, 1440],
  "export-table-1x1.png": [1080, 1080], "logo.png": [500, 500],
};
const shadow = () => ({ type: "outer", color: "0B1B3A", blur: 9, offset: 3, angle: 90, opacity: 0.18 });

// 박스 안에 비율 유지하며 이미지 배치(가운데 정렬), 흰 카드 프레임 포함
function placeCard(slide, name, bx, by, bw, bh, pad = 0.12) {
  const [ow, oh] = D[name];
  const ar = ow / oh;
  let w = bw - 2 * pad, h = w / ar;
  if (h > bh - 2 * pad) { h = bh - 2 * pad; w = h * ar; }
  const x = bx + (bw - w) / 2, y = by + (bh - h) / 2;
  slide.addShape(p.shapes.ROUNDED_RECTANGLE, {
    x: x - pad, y: y - pad, w: w + 2 * pad, h: h + 2 * pad,
    fill: { color: WHITE }, line: { color: LINE, width: 1 }, rectRadius: 0.08, shadow: shadow(),
  });
  slide.addImage({ path: IMG + name, x, y, w, h });
}

function header(slide, kicker, title) {
  slide.addImage({ path: IMG + "logo.png", x: M, y: 0.4, w: 0.64, h: 0.64 });
  slide.addText(kicker, { x: 1.34, y: 0.44, w: 9, h: 0.26, color: RED, fontSize: 10.5, bold: true, charSpacing: 3, margin: 0, fontFace: F });
  slide.addText(title, { x: 1.34, y: 0.69, w: 11.3, h: 0.62, color: NAVY, fontSize: 25, bold: true, margin: 0, fontFace: F });
}
function footer(slide, n) {
  slide.addText([
    { text: "Rendezvous 청백전 드래프트", options: { color: MUTED } },
    { text: "   " + n, options: { color: "94A3B8" } },
  ], { x: 8.3, y: 7.05, w: 4.45, h: 0.3, align: "right", fontSize: 9, margin: 0, fontFace: F });
}
function bullets(slide, items, x, y, w, h) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 16 }, breakLine: true, paraSpaceAfter: 12 } })),
    { x, y, w, h, valign: "top", color: INK, fontSize: 15, fontFace: F, lineSpacingMultiple: 1.05 },
  );
}
function caption(slide, t, x, y, w) {
  slide.addText(t, { x, y, w, h: 0.3, align: "center", color: MUTED, fontSize: 11, margin: 0, fontFace: F });
}

// ── S1 표지 ──────────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: NAVYD };
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 0.16, fill: { color: RED } });
  s.addImage({ path: IMG + "logo.png", x: (W - 1.9) / 2, y: 1.15, w: 1.9, h: 1.9 });
  s.addText("Rendezvous 청백전 드래프트", { x: 0, y: 3.25, w: W, h: 0.8, align: "center", color: WHITE, fontSize: 40, bold: true, fontFace: F });
  s.addText("실시간 포지션 드래프트 · 현장 중계 · 응원 채팅", { x: 0, y: 4.15, w: W, h: 0.5, align: "center", color: ICE, fontSize: 18, fontFace: F });
  s.addText("기능 소개 — 실제 화면 기반", { x: 0, y: 4.75, w: W, h: 0.4, align: "center", color: "9DB6DA", fontSize: 13, fontFace: F });
  s.addText("CHUNG-ANG UNIV. BASEBALL TEAM · SINCE 1987", { x: 0, y: 6.7, w: W, h: 0.35, align: "center", color: "7E97C0", fontSize: 11, charSpacing: 2, fontFace: F });
}

// ── S2 개요 ──────────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "OVERVIEW", "하나의 드래프트, 세 개의 화면");
  s.addText("관리자가 PC에서 세팅·통제하고, 두 팀 대표는 휴대폰으로 포지션별로 선수를 지명하며, 누구나 현황 화면에서 실시간으로 지켜봅니다.",
    { x: M, y: 1.5, w: 12.2, h: 0.5, color: MUTED, fontSize: 14, margin: 0, fontFace: F });
  const cards = [
    { img: "status-pc-idle.png", t: "현황 페이지", d: "공개 · PC/모바일\n스코어보드 · 라이브 영상 · 로스터 · 접속자수 · 채팅", c: NAVY },
    { img: "admin-setup.png", t: "관리자 페이지", d: "PC\n팀·핀·포지션·선수 설정 · 시작/대리지명/취소/리셋", c: RED },
    { img: "captain-team.png", t: "대표자 페이지", d: "모바일\n팀 선택 + 핀 입장 · 포지션별 지명 · 내 로스터", c: NAVY },
  ];
  const cw = 3.92, gap = 0.32, x0 = M, y0 = 2.2, ch = 4.5;
  cards.forEach((cd, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: y0, w: cw, h: ch, fill: { color: WHITE }, line: { color: LINE, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    placeCard(s, cd.img, x + 0.18, y0 + 0.22, cw - 0.36, 2.35, 0.06);
    s.addShape(p.shapes.RECTANGLE, { x: x + 0.32, y: y0 + 2.75, w: 0.5, h: 0.09, fill: { color: cd.c } });
    s.addText(cd.t, { x: x + 0.3, y: y0 + 2.9, w: cw - 0.6, h: 0.4, color: NAVY, fontSize: 18, bold: true, margin: 0, fontFace: F });
    s.addText(cd.d, { x: x + 0.3, y: y0 + 3.35, w: cw - 0.6, h: 1.0, color: MUTED, fontSize: 12, margin: 0, fontFace: F, lineSpacingMultiple: 1.1 });
  });
  footer(s, "2");
}

// ── S3 현황 PC ───────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "LIVE STATUS", "현황 페이지 — 모두가 보는 중계 화면");
  placeCard(s, "status-pc-idle.png", M, 1.7, 7.2, 4.7);
  caption(s, "현황 페이지 (PC)", M, 6.45, 7.2);
  bullets(s, [
    "스코어보드 — 팀별 지명 수·현재 라운드·지명 중 팀",
    "라이브 영상 — YouTube 라이브 임베드",
    "접속자수 — 지금 보는 인원 실시간 표시",
    "응원 채팅 — 닉네임만 정하면 누구나 참여",
    "참가 선수 풀 — 포지션 표시, 지명되면 팀 뱃지",
  ], 8.1, 1.95, 4.7, 4.5);
  footer(s, "3");
}

// ── S4 현황 모바일 & 채팅 ─────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "LIVE STATUS", "실시간 동기화 & 응원 채팅");
  placeCard(s, "status-mobile-live.png", M, 1.7, 3.1, 4.9);
  placeCard(s, "status-chat.png", 3.75, 2.4, 3.0, 2.0);
  placeCard(s, "status-chat-cooldown.png", 3.75, 4.5, 3.0, 2.0);
  caption(s, "모바일 현황 · 채팅(도배 방지)", M, 6.65, 6.2);
  bullets(s, [
    "실시간 동기화 — 지명 즉시 모든 화면 자동 갱신",
    "지명 중 강조 — 현재 차례 팀을 빨간 테두리로",
    "대형 지명 발표 팝업 — 새 선수 지명 시 전체 화면",
    "채팅 도배 방지 — 너무 빨리 보내면 3초 쿨다운",
  ], 7.1, 2.0, 5.7, 4.3);
  footer(s, "4");
}

// ── S5 관리자 설정 ────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "ADMIN", "관리자 — 드래프트 설정");
  placeCard(s, "admin-setup.png", M, 1.65, 5.0, 5.5);
  caption(s, "설정 단계 (포지션·선수 등록)", M, 7.15, 5.0);
  bullets(s, [
    "팀 · 대표 정보 — 청팀(A)/백팀(B) 이름·대표",
    "4자리 접속 핀번호 — 팀별 지정",
    "포지션 목록 — 콤마로 직접 정의(투수·포수·내야수·외야수)",
    "참가 선수 — 한 줄에 「이름,포지션」",
    "선픽 지정 · 라이브 미러로 실시간 확인",
  ], 6.0, 2.0, 6.8, 4.6);
  footer(s, "5");
}

// ── S6 관리자 진행 ────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "ADMIN", "관리자 — 진행 통제");
  placeCard(s, "admin-live.png", M, 1.95, 7.2, 3.7);
  caption(s, "진행 단계 (설정 잠금)", M, 5.75, 7.2);
  bullets(s, [
    "현재 차례 — 지명할 팀과 라운드 표시",
    "대리 지명 — 대표 부재 시 관리자가 대신",
    "직전 픽 취소 — 실수한 지명 되돌리기",
    "자동 스킵 — 더 못 뽑는 팀 차례는 건너뜀",
    "설정 잠금 — 진행 중 설정 변경 방지",
  ], 8.1, 2.0, 4.7, 4.5);
  footer(s, "6");
}

// ── S7 대표자 입장 ────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "CAPTAIN", "대표자 — 휴대폰으로 입장 & 지명");
  const phones = [
    { img: "captain-team.png", cap: "① 팀 선택" },
    { img: "captain-pin.png", cap: "② 4자리 핀 입장" },
    { img: "captain-yourturn.png", cap: "③ 내 차례 알림" },
  ];
  const bw = 3.0, gap = 0.7, total = phones.length * bw + (phones.length - 1) * gap;
  const x0 = (W - total) / 2;
  phones.forEach((ph, i) => {
    const x = x0 + i * (bw + gap);
    placeCard(s, ph.img, x, 1.6, bw, 4.7);
    caption(s, ph.cap, x, 6.4, bw);
  });
  s.addText("팀을 먼저 고르고 핀을 입력 → 내 차례가 되면 자동 팝업으로 알림", { x: M, y: 6.85, w: 12.2, h: 0.4, align: "center", color: MUTED, fontSize: 13, margin: 0, fontFace: F });
  footer(s, "7");
}

// ── S8 대표자 포지션별 지명 ───────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "CAPTAIN", "대표자 — 포지션별 지명");
  placeCard(s, "captain-pick.png", M, 1.6, 3.7, 5.6);
  bullets(s, [
    "포지션 그룹 — 선수가 포지션별로 묶여 표시",
    "꽉 찬 포지션 비활성 — 팀당 같은 포지션 최대 2명",
    "지명 확인 단계 — 한 번 더 확인(오선택 방지)",
    "비차례 보호 — 내 차례가 아니면 선택 비활성",
    "내가 뽑은 선수 — 라운드 순서로 확인",
  ], 4.7, 2.0, 5.4, 3.4);
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x: 4.7, y: 5.55, w: 8.1, h: 1.05, fill: { color: "FDECEA" }, line: { color: RED, width: 1 }, rectRadius: 0.1 });
  s.addText([
    { text: "포지션 캡  ", options: { bold: true, color: RED, fontSize: 17 } },
    { text: "한 팀은 같은 포지션을 최대 2명까지만 — 「2/2 꽉 참」이면 자동 비활성", options: { color: INK, fontSize: 13 } },
  ], { x: 4.95, y: 5.72, w: 7.7, h: 0.7, valign: "middle", margin: 0, fontFace: F });
  footer(s, "8");
}

// ── S9 드래프트 방식 ──────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "HOW IT WORKS", "드래프트 방식 — 스네이크 + 포지션");
  const steps = [
    { n: "1", t: "스네이크 순서", d: "1R 청·백 → 2R 백·청 → 3R 청·백 … 라운드마다 순서가 뒤집혀 공정", c: NAVY },
    { n: "2", t: "포지션 캡", d: "선수를 포지션별로 나눠 지명, 한 팀당 같은 포지션 최대 2명", c: RED },
    { n: "3", t: "자동 스킵 & 종료", d: "더 못 뽑는 팀 차례는 건너뜀, 양 팀 모두 불가하면 종료", c: NAVY },
    { n: "4", t: "서버 규칙 강제", d: "차례·포지션 캡·중복·순번을 서버가 검증해 차단(실시간 동기화)", c: RED },
  ];
  const cw = 2.95, gap = 0.3, x0 = M, y0 = 2.3, ch = 3.6;
  steps.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: y0, w: cw, h: ch, fill: { color: WHITE }, line: { color: LINE, width: 1 }, rectRadius: 0.1, shadow: shadow() });
    s.addShape(p.shapes.OVAL, { x: x + 0.32, y: y0 + 0.34, w: 0.85, h: 0.85, fill: { color: st.c } });
    s.addText(st.n, { x: x + 0.32, y: y0 + 0.34, w: 0.85, h: 0.85, align: "center", valign: "middle", color: WHITE, fontSize: 26, bold: true, margin: 0, fontFace: F });
    s.addText(st.t, { x: x + 0.3, y: y0 + 1.45, w: cw - 0.6, h: 0.5, color: NAVY, fontSize: 17, bold: true, margin: 0, fontFace: F });
    s.addText(st.d, { x: x + 0.3, y: y0 + 2.0, w: cw - 0.6, h: 1.4, color: MUTED, fontSize: 12.5, margin: 0, fontFace: F, lineSpacingMultiple: 1.15 });
  });
  footer(s, "9");
}

// ── S10 결과: 표 & 그라운드 ───────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "RESULT", "최종 명단 — 표 & 그라운드 배치");
  placeCard(s, "export-table-1x1.png", M, 1.85, 3.5, 3.9);
  caption(s, "표", M, 5.8, 3.5);
  placeCard(s, "export-field-1x1.png", 4.2, 1.85, 3.9, 3.9);
  caption(s, "그라운드 (실제 수비 위치)", 4.2, 5.8, 3.9);
  bullets(s, [
    "표 / 그라운드 보기 전환",
    "포지션명을 실제 수비 위치로 매핑",
    "내야수·외야수 묶음도 지원",
    "완료 시 현황·관리자 화면 상단에 표시",
  ], 8.55, 2.05, 4.3, 4.0);
  footer(s, "10");
}

// ── S11 결과: 이미지 내보내기 ─────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: BG };
  header(s, "EXPORT", "이미지 내보내기 — 1:1 / 3:4");
  placeCard(s, "export-field-1x1.png", M, 1.9, 3.7, 3.7);
  caption(s, "1:1 (SNS 피드)", M, 5.7, 3.7);
  placeCard(s, "export-field-3x4.png", 4.4, 1.6, 3.4, 4.5);
  caption(s, "3:4 (세로)", 4.4, 6.15, 3.4);
  bullets(s, [
    "팀별 PNG 다운로드",
    "1:1 정사각 · 3:4 세로 선택",
    "청팀=네이비 / 백팀=화이트·레드",
    "로고·팀명·날짜 포함, 외부 도구 불필요",
  ], 8.2, 2.05, 4.6, 4.0);
  footer(s, "11");
}

// ── S12 마무리 ───────────────────────────────────────────
{
  const s = p.addSlide();
  s.background = { color: NAVYD };
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: H - 0.16, w: W, h: 0.16, fill: { color: RED } });
  s.addImage({ path: IMG + "logo.png", x: (W - 1.5) / 2, y: 0.95, w: 1.5, h: 1.5 });
  s.addText("현장에서 바로 진행하세요", { x: 0, y: 2.6, w: W, h: 0.7, align: "center", color: WHITE, fontSize: 32, bold: true, fontFace: F });
  const routes = [
    { k: "/", v: "현황 (공개 · PC/모바일)" },
    { k: "/admin", v: "관리자 (PC)" },
    { k: "/team", v: "대표자 (모바일 · 핀)" },
  ];
  const cw = 3.6, gap = 0.5, total = routes.length * cw + (routes.length - 1) * gap, x0 = (W - total) / 2;
  routes.forEach((r, i) => {
    const x = x0 + i * (cw + gap);
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y: 3.8, w: cw, h: 1.3, fill: { color: "1E4B8E" }, line: { color: "3A63A0", width: 1 }, rectRadius: 0.1 });
    s.addText(r.k, { x, y: 4.0, w: cw, h: 0.5, align: "center", color: WHITE, fontSize: 22, bold: true, margin: 0, fontFace: F });
    s.addText(r.v, { x, y: 4.55, w: cw, h: 0.4, align: "center", color: ICE, fontSize: 12, margin: 0, fontFace: F });
  });
  s.addText("Rendezvous 청백전 드래프트 · CHUNG-ANG UNIV. BASEBALL TEAM · SINCE 1987",
    { x: 0, y: 6.6, w: W, h: 0.4, align: "center", color: "7E97C0", fontSize: 11, charSpacing: 1, fontFace: F });
}

p.writeFile({ fileName: path.join(INTRO, "Rendezvous-드래프트-소개.pptx") }).then((fn) =>
  console.log("saved:", fn),
);
