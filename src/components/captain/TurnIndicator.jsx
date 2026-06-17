import { STATUS } from "../../lib/constants.js";

// 현재 차례 상태 배너 (대표 화면 상단).
export default function TurnIndicator({ draft, myTeam, teamNames }) {
  const status = draft?.status ?? STATUS.SETUP;

  if (status === STATUS.SETUP) {
    return (
      <Banner tone="wait">드래프트 시작을 기다리는 중입니다…</Banner>
    );
  }
  if (status === STATUS.DONE) {
    return <Banner tone="done">드래프트가 종료되었습니다 🎉</Banner>;
  }
  const isMine = draft.currentPicker === myTeam;
  if (isMine) {
    return (
      <Banner tone="mine">
        🔥 지금 내 차례 — ROUND {draft.currentRound}
      </Banner>
    );
  }
  const otherName = teamNames?.[draft.currentPicker] || "상대 팀";
  return (
    <Banner tone="wait">
      {otherName} 지명 중 — ROUND {draft.currentRound}
    </Banner>
  );
}

function Banner({ tone, children }) {
  const tones = {
    mine: "bg-brand-red text-white",
    wait: "bg-slate-200 text-slate-600",
    done: "bg-navy text-white",
  };
  return (
    <div
      className={`rounded-xl px-4 py-3 text-center text-base font-bold ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
