import { groupByRound } from "../../hooks/useDraft.js";
import TeamBadge from "../common/TeamBadge.jsx";
import { TEAM } from "../../lib/constants.js";

// 한 팀의 지명 선수를 라운드 순서로.
export default function TeamRosterColumn({ team, name, captainName, picks, highlight }) {
  const grouped = groupByRound(picks);
  const isA = team === TEAM.A;
  return (
    <section
      className={`rounded-2xl bg-white p-4 shadow-sm ${
        highlight ? `ring-2 ${isA ? "ring-navy" : "ring-brand-red"}` : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TeamBadge team={team} name={name} />
          {highlight && (
            <span className="animate-pulse text-xs font-bold text-brand-red">
              ● 지명 중
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-slate-500">
          {picks.length}명
        </span>
      </div>
      {captainName && (
        <p className="mb-2 text-xs text-slate-400">대표: {captainName}</p>
      )}
      {grouped.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">아직 지명 없음</p>
      ) : (
        <ul className="space-y-1.5">
          {grouped.map(([round, rPicks]) =>
            rPicks.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                    isA ? "bg-navy" : "bg-brand-red"
                  }`}
                >
                  {round}
                </span>
                <span className="font-medium text-slate-800">{p.playerName}</span>
                {p.position && (
                  <span className="ml-auto text-xs font-medium text-slate-400">
                    {p.position}
                  </span>
                )}
              </li>
            )),
          )}
        </ul>
      )}
    </section>
  );
}
