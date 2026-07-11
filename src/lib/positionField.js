// 관리자가 자유롭게 정한 포지션 이름을 야구 수비 위치로 매핑한다.
// (한국어/영문/약어/묶음(내야수·외야수) 지원. 인식 실패 시 null → 기타로 표기)

// 정규화된 필드 좌표 (x: 0 좌 ~ 1 우, y: 0 위(외야) ~ 1 아래(홈))
export const SLOTS = {
  C: { x: 0.5, y: 0.95 },
  P: { x: 0.5, y: 0.63 },
  "1B": { x: 0.72, y: 0.6 },
  "2B": { x: 0.6, y: 0.45 },
  SS: { x: 0.4, y: 0.45 },
  "3B": { x: 0.28, y: 0.6 },
  LF: { x: 0.19, y: 0.26 },
  CF: { x: 0.5, y: 0.16 },
  RF: { x: 0.81, y: 0.26 },
  DH: { x: 0.88, y: 0.92 },
  INF: { x: 0.5, y: 0.53 }, // 내야 묶음
  OF: { x: 0.5, y: 0.24 }, // 외야 묶음
  INF_BACKUP: { x: 0.18, y: 0.84 }, // 내야 후보
  OF_BACKUP: { x: 0.18, y: 0.14 }, // 외야 후보
};

const EXACT = {
  p: "P", c: "C", "1b": "1B", "2b": "2B", "3b": "3B", ss: "SS",
  lf: "LF", cf: "CF", rf: "RF", dh: "DH", if: "INF", of: "OF",
};

// 부분일치 규칙 (구체적인 것부터)
const RULES = [
  ["INF_BACKUP", ["내야후보", "내야백업"]],
  ["OF_BACKUP", ["외야후보", "외야백업"]],
  ["1B", ["1루", "일루"]],
  ["2B", ["2루", "이루"]],
  ["3B", ["3루", "삼루"]],
  ["SS", ["유격"]],
  ["C", ["포수"]],
  ["P", ["투수"]],
  ["LF", ["좌익", "좌"]],
  ["CF", ["중견", "중"]],
  ["RF", ["우익", "우"]],
  ["DH", ["지명"]],
  ["INF", ["내야"]],
  ["OF", ["외야"]],
];

export function resolveSlot(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  if (EXACT[s]) return EXACT[s];
  for (const [slot, toks] of RULES) {
    if (toks.some((t) => s.includes(t))) return slot;
  }
  return null;
}
