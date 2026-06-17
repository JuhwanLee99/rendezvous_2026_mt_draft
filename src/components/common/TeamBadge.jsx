import { TEAM } from "../../lib/constants.js";

// 팀 칩. A=청(네이비), B=백(레드 테두리). 대비 확보된 채움 스타일.
export default function TeamBadge({ team, name, size = "md", className = "" }) {
  const isA = team === TEAM.A;
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  const style = isA
    ? "bg-navy text-white border border-navy"
    : "bg-white text-brand-red border-2 border-brand-red";
  const label = name || (isA ? "청팀" : "백팀");
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizes[size]} ${style} ${className}`}
    >
      {label}
    </span>
  );
}
