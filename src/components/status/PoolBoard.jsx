import TeamBadge from "../common/TeamBadge.jsx";
import { displayPositionOf } from "../../lib/positionRules.js";

// 전체 참가 선수 목록. 지명된 선수는 회색 처리 + 팀 뱃지.
export default function PoolBoard({ players, teamNames = {} }) {
  const available = players.filter((p) => p.status !== "picked").length;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-navy">참가 선수</h2>
        <span className="text-sm text-slate-500">
          남은 선수 {available} / 전체 {players.length}
        </span>
      </div>
      {players.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          등록된 선수가 없습니다.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {players.map((p) => {
            const picked = p.status === "picked";
            const positionLabel = displayPositionOf(p);
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  picked
                    ? "border-slate-200 bg-slate-100 text-slate-400"
                    : "border-slate-200 bg-white text-slate-800"
                }`}
              >
                <span className="flex min-w-0 flex-col">
                  <span className={`truncate font-medium ${picked ? "line-through" : ""}`}>
                    {p.name}
                  </span>
                  {positionLabel && (
                    <span className="text-[11px] text-slate-400">{positionLabel}</span>
                  )}
                </span>
                {picked && (
                  <TeamBadge
                    team={p.pickedBy}
                    name={teamNames[p.pickedBy]}
                    size="sm"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
