import { TEAM } from "../../lib/constants.js";
import { displayPositionOf } from "../../lib/positionRules.js";
import logo from "../../assets/logo.png";

// 선수가 지명될 때 화면 전체에 크게 뜨는 발표 팝업.
export default function PickAnnouncementModal({ pick, teamName, onClose }) {
  if (!pick) return null;
  const isA = pick.team === TEAM.A;
  const bg = isA
    ? "from-navy to-navy-dark"
    : "from-brand-red to-brand-red-dark";
  const positionLabel = displayPositionOf(pick);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`animate-pop-in w-full max-w-lg rounded-3xl bg-gradient-to-br ${bg} p-8 text-center text-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={logo}
          alt=""
          className="mx-auto mb-3 h-16 w-16 rounded-full bg-white/90 p-1"
        />
        <p className="text-sm font-semibold tracking-widest text-white/80">
          ROUND {pick.round} · {pick.teamPickIndex + 1}번째 지명
        </p>
        <p className="mt-3 text-2xl font-extrabold">
          {teamName || (isA ? "청팀" : "백팀")}
        </p>
        <p className="mt-1 text-base text-white/80">지명 선수</p>
        <p className="mt-2 text-5xl font-black drop-shadow">{pick.playerName}</p>
        {positionLabel && (
          <p className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1 text-lg font-bold">
            {positionLabel}
          </p>
        )}
        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-full bg-white/20 px-6 py-2 text-sm font-semibold backdrop-blur hover:bg-white/30"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
