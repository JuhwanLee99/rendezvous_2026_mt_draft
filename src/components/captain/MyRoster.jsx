import { groupByRound } from "../../hooks/useDraft.js";
import { TEAM } from "../../lib/constants.js";

// 내가 뽑은 선수 목록 (라운드 순).
export default function MyRoster({ team, picks }) {
  const grouped = groupByRound(picks);
  const isA = team === TEAM.A;
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">내가 뽑은 선수</h2>
        <span className="text-sm font-semibold text-slate-500">
          {picks.length}명
        </span>
      </div>
      {grouped.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">아직 없음</p>
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
