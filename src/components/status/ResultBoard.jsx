import { useEffect, useState } from "react";
import { TEAM } from "../../lib/constants.js";
import { downloadTeamCard } from "../../lib/teamCard.js";
import { downloadFieldCard, renderFieldCard } from "../../lib/fieldCard.js";

function Toggle({ value, set, options }) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => set(o.v)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
            value === o.v
              ? "border-navy bg-navy text-white"
              : "border-slate-300 bg-white text-slate-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// 드래프트 완료 시: 팀별 포지션 명단(표/그라운드) + 이미지(1:1 / 3:4) 내보내기.
export default function ResultBoard({ draft, picks }) {
  const [ratio, setRatio] = useState("1:1");
  const [view, setView] = useState("field"); // "table" | "field"
  const [busy, setBusy] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ko-KR"));
  }, []);

  const positions = draft?.positions || [];
  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };
  const captains = {
    [TEAM.A]: draft?.teamA?.captainName || "",
    [TEAM.B]: draft?.teamB?.captainName || "",
  };

  const picksByPos = (team) => {
    const tp = picks.filter((p) => p.team === team);
    const map = {};
    for (const pos of positions)
      map[pos] = tp.filter((p) => p.position === pos).map((p) => p.playerName);
    return map;
  };
  const optsFor = (team) => ({
    team,
    teamName: teamNames[team],
    captainName: captains[team],
    positions,
    picksByPos: picksByPos(team),
    ratio,
    dateStr,
  });

  const handleExport = async (team) => {
    setBusy(team + view + ratio);
    try {
      const opts = optsFor(team);
      if (view === "field") await downloadFieldCard(opts);
      else await downloadTeamCard(opts);
    } finally {
      setBusy("");
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-navy">🏁 최종 명단</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle
            value={view}
            set={setView}
            options={[
              { v: "field", label: "그라운드" },
              { v: "table", label: "표" },
            ]}
          />
          <Toggle
            value={ratio}
            set={setRatio}
            options={[
              { v: "1:1", label: "1:1" },
              { v: "3:4", label: "3:4" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[TEAM.A, TEAM.B].map((team) => {
          const isA = team === TEAM.A;
          const map = picksByPos(team);
          return (
            <div
              key={team}
              className={`overflow-hidden rounded-2xl border ${
                isA ? "border-navy/30" : "border-brand-red/30"
              }`}
            >
              <div
                className={`flex items-center justify-between px-4 py-3 text-white ${
                  isA ? "bg-navy" : "bg-brand-red"
                }`}
              >
                <span className="text-base font-extrabold">{teamNames[team]}</span>
                {captains[team] && (
                  <span className="text-xs opacity-80">대표 {captains[team]}</span>
                )}
              </div>

              {view === "field" ? (
                <div className="p-3">
                  <FieldView opts={optsFor(team)} />
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {positions.map((pos) => (
                    <li key={pos} className="flex items-center gap-3 px-4 py-2.5">
                      <span
                        className={`w-20 shrink-0 rounded-full px-2 py-1 text-center text-xs font-bold ${
                          isA ? "bg-navy/10 text-navy" : "bg-brand-red/10 text-brand-red"
                        }`}
                      >
                        {pos}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {map[pos].length ? (
                          map[pos].join(" · ")
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="p-3 pt-0">
                <button
                  type="button"
                  onClick={() => handleExport(team)}
                  disabled={!!busy}
                  className={`w-full rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
                    isA ? "bg-navy active:bg-navy-dark" : "bg-brand-red active:bg-brand-red-dark"
                  }`}
                >
                  {busy === team + view + ratio
                    ? "이미지 생성 중…"
                    : `${teamNames[team]} ${view === "field" ? "필드" : "명단"} 이미지 저장 (${ratio})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// 그라운드 미리보기 (renderFieldCard 결과를 이미지로 표시)
function FieldView({ opts }) {
  const [url, setUrl] = useState(null);
  const key = JSON.stringify(opts);
  useEffect(() => {
    let alive = true;
    renderFieldCard(opts).then((c) => {
      if (alive) setUrl(c.toDataURL("image/png"));
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!url)
    return <div className="aspect-square w-full animate-pulse rounded-xl bg-slate-100" />;
  return <img src={url} alt="그라운드 명단" className="w-full rounded-xl" />;
}
