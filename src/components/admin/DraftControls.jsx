import { useState } from "react";
import { STATUS, TEAM } from "../../lib/constants.js";
import TeamBadge from "../common/TeamBadge.jsx";

export default function DraftControls({ draft, availablePlayers, actions }) {
  const status = draft?.status ?? STATUS.SETUP;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proxyId, setProxyId] = useState("");

  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };

  const run = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message || "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-navy">드래프트 진행</h2>

      {status === STATUS.SETUP && (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            설정을 마친 뒤 시작하세요. 시작 후에는 선수 풀이 잠깁니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(actions.startDraft)}
            className="w-full rounded-lg bg-brand-red py-3 text-lg font-bold text-white disabled:opacity-50"
          >
            드래프트 시작
          </button>
        </div>
      )}

      {status === STATUS.LIVE && (
        <div className="space-y-5">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3">
            <span className="text-sm text-slate-500">현재 차례</span>
            <TeamBadge
              team={draft.currentPicker}
              name={teamNames[draft.currentPicker]}
            />
            <span className="text-sm font-bold text-slate-600">
              R{draft.currentRound}
            </span>
          </div>

          {/* 대리 지명 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              대리 지명 ({teamNames[draft.currentPicker]} 대신)
            </label>
            <div className="flex gap-2">
              <select
                value={proxyId}
                onChange={(e) => setProxyId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
              >
                <option value="">선수 선택…</option>
                {availablePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy || !proxyId}
                onClick={() =>
                  run(async () => {
                    await actions.makePick(proxyId, draft.currentPicker);
                    setProxyId("");
                  })
                }
                className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                지명
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={busy || draft.pickCount <= 0}
            onClick={() => run(actions.undoLastPick)}
            className="w-full rounded-lg border border-slate-300 py-2.5 font-semibold text-slate-700 disabled:opacity-50"
          >
            ↶ 직전 픽 취소
          </button>
        </div>
      )}

      {status === STATUS.DONE && (
        <p className="rounded-xl bg-navy/5 py-4 text-center font-bold text-navy">
          드래프트 종료 🎉
        </p>
      )}

      {status !== STATUS.SETUP && (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                "전체 리셋하시겠습니까? 모든 픽이 취소되고 설정 단계로 돌아갑니다.",
              )
            )
              run(actions.resetDraft);
          }}
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold text-brand-red hover:bg-brand-red/5"
        >
          전체 리셋
        </button>
      )}

      {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}
    </section>
  );
}
