// 팀별 명단 카드(표형)를 Canvas 로 그려 PNG 로 내보낸다. 공통 헬퍼는 fieldCard 도 사용.
import logo from "../assets/logo.png";
import { POSITION_CAP } from "./constants.js";

export const FONT = "'Apple SD Gothic Neo', 'Pretendard', 'Malgun Gothic', sans-serif";

export const THEME = {
  A: {
    bg1: "#1e4b8e", bg2: "#16386b", text: "#ffffff", sub: "#cfe0f5",
    pillBg: "#ffffff", pillText: "#1e4b8e", line: "rgba(255,255,255,0.18)",
    empty: "rgba(255,255,255,0.45)", border: null, accent: "#1e4b8e",
  },
  B: {
    bg1: "#ffffff", bg2: "#eef2f7", text: "#16386b", sub: "#64748b",
    pillBg: "#da291c", pillText: "#ffffff", line: "rgba(0,0,0,0.10)",
    empty: "#cbd5e1", border: "#da291c", accent: "#da291c",
  },
};

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function paintBackground(ctx, W, H, th) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, th.bg1);
  g.addColorStop(1, th.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (th.border) {
    ctx.strokeStyle = th.border;
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, W - 16, H - 16);
  }
}

// 로고 + 팀명 + 부제 + 대표. 본문 시작 y 를 반환.
export async function drawHeader(ctx, { team, teamName, captainName, dateStr }, W, P, th) {
  let y = P;
  try {
    const im = await loadImage(logo);
    const s = 150;
    ctx.drawImage(im, (W - s) / 2, y, s, s);
    y += s + 22;
  } catch {
    y += 40;
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = th.text;
  ctx.font = `800 84px ${FONT}`;
  ctx.fillText(teamName || (team === "A" ? "청팀" : "백팀"), W / 2, y + 76);
  y += 106;
  ctx.fillStyle = th.sub;
  ctx.font = `500 32px ${FONT}`;
  ctx.fillText(`Rendezvous 청백전 드래프트${dateStr ? " · " + dateStr : ""}`, W / 2, y + 30);
  y += 44;
  if (captainName) {
    ctx.fillText(`대표 ${captainName}`, W / 2, y + 30);
    y += 44;
  }
  return y + 20;
}

export function drawFooter(ctx, W, H, P, th) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = th.sub;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("CHUNG-ANG UNIV. BASEBALL TEAM · SINCE 1987", W / 2, H - P + 6);
}

export function sizeFor(ratio) {
  return { W: 1080, H: ratio === "3:4" ? 1440 : 1080 };
}

export async function renderTeamCard(opts) {
  const { team, positions = [], picksByPos = {}, ratio = "1:1" } = opts;
  const { W, H } = sizeFor(ratio);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const th = THEME[team] || THEME.A;
  const P = 84;

  paintBackground(ctx, W, H, th);
  const bodyTop = await drawHeader(ctx, opts, W, P, th);

  const footerH = 84;
  const bodyH = H - bodyTop - footerH - P;
  const rows = positions.length || 1;
  const rowH = Math.min(bodyH / rows, 150);
  const startY = bodyTop + Math.max(0, (bodyH - rowH * rows) / 2);

  ctx.textBaseline = "middle";
  positions.forEach((pos, i) => {
    const top = startY + i * rowH;
    const cy = top + rowH / 2;
    if (i > 0) {
      ctx.strokeStyle = th.line;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(P, top);
      ctx.lineTo(W - P, top);
      ctx.stroke();
    }
    const pillH = Math.min(66, rowH - 28);
    const pillW = 230;
    roundRect(ctx, P, cy - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = th.pillBg;
    ctx.fill();
    ctx.fillStyle = th.pillText;
    ctx.font = `700 ${Math.round(pillH * 0.46)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(pos, P + pillW / 2, cy + 1);
    const names = picksByPos[pos] || [];
    ctx.textAlign = "left";
    ctx.fillStyle = names.length ? th.text : th.empty;
    ctx.font = `600 ${Math.round(Math.min(58, rowH * 0.4))}px ${FONT}`;
    ctx.fillText(names.length ? names.join("   ·   ") : "—", P + pillW + 44, cy + 1);
  });

  drawFooter(ctx, W, H, P, th);
  return canvas;
}

export async function downloadTeamCard(opts) {
  const canvas = await renderTeamCard(opts);
  triggerDownload(canvas, opts, "명단");
}

export function triggerDownload(canvas, opts, suffix) {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `${opts.teamName || opts.team}_${suffix}_${opts.ratio === "3:4" ? "3x4" : "1x1"}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export { POSITION_CAP };
