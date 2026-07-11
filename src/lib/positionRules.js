import { resolveSlot } from "./positionField.js";

const keyOf = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");

const FALLBACK_POSITIONS_BY_SLOT = {
  P: ["투수"],
  C: ["포수"],
  "1B": ["내야수", "내야"],
  "2B": ["내야수", "내야"],
  "3B": ["내야수", "내야"],
  SS: ["내야수", "내야"],
  LF: ["외야수", "외야"],
  CF: ["외야수", "외야"],
  RF: ["외야수", "외야"],
  DH: ["지명타자", "지명"],
  INF: ["내야수", "내야"],
  OF: ["외야수", "외야"],
  INF_BACKUP: ["내야수", "내야"],
  OF_BACKUP: ["외야수", "외야"],
};

export const parsePositions = (text) =>
  String(text || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export function resolveRulePosition(rawPosition, positions = []) {
  const position = String(rawPosition || "").trim();
  if (!position) return "";

  const exact = positions.find((configured) => keyOf(configured) === keyOf(position));
  if (exact) return exact;

  const slot = resolveSlot(position);
  const fallbackNames = slot ? FALLBACK_POSITIONS_BY_SLOT[slot] || [] : [];
  const fallbackKeys = new Set(fallbackNames.map(keyOf));
  const fallback = positions.find((configured) => fallbackKeys.has(keyOf(configured)));

  return fallback || position;
}

export function parsePlayers(text, positions = []) {
  return String(text || "")
    .split("\n")
    .map((line) => {
      const parts = line.split(",");
      const name = (parts[0] || "").trim();
      const positionLabel = (parts[1] || "").trim();
      return {
        name,
        position: resolveRulePosition(positionLabel, positions),
        positionLabel,
      };
    })
    .filter((player) => player.name);
}

export function displayPositionOf(item) {
  return item?.positionLabel || item?.position || "";
}
