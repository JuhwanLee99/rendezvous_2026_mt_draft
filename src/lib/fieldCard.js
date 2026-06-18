// 팀 명단을 "야구 그라운드" 위 수비 위치에 배치해 Canvas 로 그리고 PNG 로 내보낸다.
import {
  FONT, THEME, roundRect, paintBackground, drawHeader, drawFooter,
  sizeFor, triggerDownload,
} from "./teamCard.js";
import { SLOTS, resolveSlot } from "./positionField.js";

export function getFieldGeometry(fx, fy, fw, fh) {
  const home = { x: fx + fw * 0.5, y: fy + fh * 0.9 };
  const foulReach = Math.min(fw * 0.45, fh * 0.55);
  const baseLeg = Math.min(fw * 0.215, fh * 0.255);
  const leftFoul = { x: home.x - foulReach, y: home.y - foulReach };
  const rightFoul = { x: home.x + foulReach, y: home.y - foulReach };
  const first = { x: home.x + baseLeg, y: home.y - baseLeg };
  const second = { x: home.x, y: home.y - baseLeg * 2 };
  const third = { x: home.x - baseLeg, y: home.y - baseLeg };

  return {
    home, leftFoul, rightFoul, first, second, third,
    mound: { x: home.x, y: home.y - baseLeg },
  };
}

function drawField(ctx, fx, fy, fw, fh) {
  const geometry = getFieldGeometry(fx, fy, fw, fh);
  const { home, leftFoul, rightFoul, first, second, third, mound } = geometry;
  ctx.save();
  roundRect(ctx, fx, fy, fw, fh, 26);
  ctx.clip();
  // 잔디 + 줄무늬
  const g = ctx.createLinearGradient(0, fy, 0, fy + fh);
  g.addColorStop(0, "#3f9457");
  g.addColorStop(1, "#2f7544");
  ctx.fillStyle = g;
  ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = "rgba(255,255,255,0.045)";
  for (let i = 0; i < 10; i += 2) ctx.fillRect(fx + (i * fw) / 10, fy, fw / 10, fh);
  // 외야 펜스
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(4, fw * 0.012);
  ctx.beginPath();
  ctx.moveTo(leftFoul.x, leftFoul.y);
  ctx.quadraticCurveTo(fx + fw * 0.5, fy + fh * 0.02, rightFoul.x, rightFoul.y);
  ctx.stroke();
  // 파울 라인
  ctx.beginPath();
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(leftFoul.x, leftFoul.y);
  ctx.moveTo(home.x, home.y);
  ctx.lineTo(rightFoul.x, rightFoul.y);
  ctx.stroke();
  // 내야 흙 다이아몬드
  const diamond = () => {
    ctx.beginPath();
    ctx.moveTo(home.x, home.y);
    ctx.lineTo(first.x, first.y);
    ctx.lineTo(second.x, second.y);
    ctx.lineTo(third.x, third.y);
    ctx.closePath();
  };
  diamond();
  ctx.fillStyle = "#caa46a";
  ctx.fill();
  diamond();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = Math.max(3, fw * 0.008);
  ctx.stroke();
  // 베이스
  const bs = fw * 0.022;
  const drawBase = ({ x, y }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-bs / 2, -bs / 2, bs, bs);
    ctx.restore();
  };
  drawBase(first);
  drawBase(second);
  drawBase(third);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(home.x, home.y, bs * 0.6, 0, Math.PI * 2);
  ctx.fill();
  // 마운드
  ctx.fillStyle = "#caa46a";
  ctx.beginPath();
  ctx.arc(mound.x, mound.y, fw * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMarker(ctx, px, py, label, names, th, fw) {
  const labelF = Math.max(15, fw * 0.018);
  const nameF = Math.max(22, fw * 0.027);
  const pad = fw * 0.016;
  const lines = names.length ? names : ["—"];
  ctx.font = `700 ${nameF}px ${FONT}`;
  let textW = 0;
  for (const n of lines) textW = Math.max(textW, ctx.measureText(n).width);
  ctx.font = `700 ${labelF}px ${FONT}`;
  textW = Math.max(textW, ctx.measureText(label).width);
  const w = textW + pad * 2;
  const lineH = nameF * 1.2;
  const h = labelF * 1.25 + lines.length * lineH + pad * 1.4;
  const x = Math.round(px - w / 2);
  const y = Math.round(py - h / 2);
  // 카드
  roundRect(ctx, x, y, w, h, 14);
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = th.accent;
  ctx.stroke();
  // 포지션 라벨
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = th.accent;
  ctx.font = `700 ${labelF}px ${FONT}`;
  ctx.fillText(label, px, y + pad * 0.7);
  // 선수명
  ctx.fillStyle = names.length ? "#0f172a" : "#94a3b8";
  ctx.font = `700 ${nameF}px ${FONT}`;
  lines.forEach((n, i) => {
    ctx.fillText(n, px, y + pad * 0.7 + labelF * 1.25 + i * lineH);
  });
}

export async function renderFieldCard(opts) {
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

  // 인식 실패 포지션 → 하단 "기타" 줄
  const unknown = positions.filter((p) => !resolveSlot(p));
  const extraH = unknown.length ? 70 : 0;
  const footerH = 84;
  const fw = W - 2 * P;
  const availH = H - bodyTop - footerH - P - extraH;
  const fh = Math.min(availH, fw * 1.02);
  const fx = P;
  const fy = bodyTop + Math.max(0, (availH - fh) / 2);

  drawField(ctx, fx, fy, fw, fh);

  // 마커 배치 (같은 슬롯 중복 시 살짝 아래로 오프셋)
  const used = {};
  for (const pos of positions) {
    const slot = resolveSlot(pos);
    if (!slot) continue;
    const c = SLOTS[slot];
    const n = used[slot] || 0;
    used[slot] = n + 1;
    const px = fx + c.x * fw;
    const py = fy + c.y * fh + n * (fw * 0.09);
    drawMarker(ctx, px, py, pos, picksByPos[pos] || [], th, fw);
  }

  // 기타 줄
  if (unknown.length) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = th.sub;
    ctx.font = `600 ${Math.max(20, fw * 0.022)}px ${FONT}`;
    const txt = unknown
      .map((p) => `${p}: ${(picksByPos[p] || []).join(", ") || "—"}`)
      .join("    ");
    ctx.fillText(`기타 — ${txt}`, W / 2, fy + fh + extraH / 2 + 6);
  }

  drawFooter(ctx, W, H, P, th);
  return canvas;
}

export async function downloadFieldCard(opts) {
  const canvas = await renderFieldCard(opts);
  triggerDownload(canvas, opts, "필드");
}
