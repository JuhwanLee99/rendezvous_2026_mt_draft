import { useState } from "react";
import Modal from "../common/Modal.jsx";
import { POSITION_CAP } from "../../lib/constants.js";
import { displayPositionOf } from "../../lib/positionRules.js";

// 지명 가능한 선수를 포지션별로 묶어 표시. 우리 팀이 이미 cap명 채운 포지션은 비활성.
export default function PlayerPickList({
  players,
  enabled,
  onPick,
  positions = [],
  teamPosCount = {},
  cap = POSITION_CAP,
}) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await onPick(selected.id);
      setSelected(null);
    } catch (e) {
      setError(e.message || "지명에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // 포지션 목록 순서대로, 남은 선수가 있는 그룹만
  const known = positions;
  const extra = [
    ...new Set(
      players.map((p) => p.position).filter((p) => p && !known.includes(p)),
    ),
  ];
  const groups = [...known, ...extra]
    .map((pos) => ({
      pos,
      count: teamPosCount?.[pos] || 0,
      list: players.filter((p) => p.position === pos),
    }))
    .filter((g) => g.list.length > 0);

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy">선수 지명</h2>
        <span className="text-sm text-slate-500">{players.length}명 남음</span>
      </div>

      {!enabled && (
        <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-center text-sm font-medium text-slate-500">
          내 차례가 되면 선택할 수 있어요.
        </p>
      )}

      {groups.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">남은 선수가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const full = g.count >= cap;
            return (
              <div key={g.pos}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{g.pos}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      full
                        ? "bg-brand-red/10 text-brand-red"
                        : "bg-navy/10 text-navy"
                    }`}
                  >
                    {g.count}/{cap}
                    {full ? " 꽉 참" : ""}
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-2">
                  {g.list.map((p) => {
                    const pickable = enabled && !full;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={!pickable}
                          onClick={() => setSelected(p)}
                          className={`w-full rounded-xl border px-3 py-3 text-base font-semibold transition ${
                            pickable
                              ? "border-navy/30 bg-white text-slate-800 active:bg-navy active:text-white"
                              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          {p.name}
                          {displayPositionOf(p) !== p.position && (
                            <span className="mt-0.5 block text-xs font-medium text-slate-400">
                              {displayPositionOf(p)}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!selected} onClose={() => !busy && setSelected(null)} className="text-center">
        <h3 className="text-lg font-bold text-slate-800">선수 지명 확인</h3>
        <p className="mt-3 text-3xl font-black text-navy">{selected?.name}</p>
        <p className="mt-1 text-sm text-slate-500">
          {displayPositionOf(selected)} · 이 선수를 지명하시겠습니까?
        </p>
        {error && <p className="mt-3 text-sm text-brand-red">{error}</p>}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => setSelected(null)}
            className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirm}
            className="flex-1 rounded-xl bg-navy py-3 font-bold text-white active:bg-navy-dark disabled:opacity-50"
          >
            {busy ? "지명 중…" : "지명 확정"}
          </button>
        </div>
      </Modal>
    </section>
  );
}
