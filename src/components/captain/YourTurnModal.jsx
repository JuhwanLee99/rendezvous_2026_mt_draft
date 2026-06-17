import Modal from "../common/Modal.jsx";
import TeamBadge from "../common/TeamBadge.jsx";

// 내 차례가 되면 자동으로 뜨는 팝업.
export default function YourTurnModal({ open, team, teamName, round, onStart }) {
  return (
    <Modal open={open} onClose={onStart} closeOnBackdrop={false} className="text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-5xl">⚾️</span>
        <TeamBadge team={team} name={teamName} size="lg" />
        <h2 className="text-2xl font-extrabold text-navy">지명 차례입니다!</h2>
        <p className="text-slate-500">ROUND {round} — 선수를 선택하세요.</p>
        <button
          type="button"
          onClick={onStart}
          className="mt-2 w-full rounded-xl bg-navy py-3.5 text-lg font-bold text-white active:bg-navy-dark"
        >
          선수 선택하기
        </button>
      </div>
    </Modal>
  );
}
