import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useTeamSession } from "../context/TeamSessionContext.jsx";
import { useDraft } from "../hooks/useDraft.js";
import { useDraftActions, verifyTeamPin } from "../hooks/useDraftActions.js";
import { useMyTurn } from "../hooks/useMyTurn.js";
import { STATUS, TEAM } from "../lib/constants.js";
import logo from "../assets/logo.png";
import Spinner from "../components/common/Spinner.jsx";
import PinPad from "../components/common/PinPad.jsx";
import TeamBadge from "../components/common/TeamBadge.jsx";
import TurnIndicator from "../components/captain/TurnIndicator.jsx";
import YourTurnModal from "../components/captain/YourTurnModal.jsx";
import PlayerPickList from "../components/captain/PlayerPickList.jsx";
import MyRoster from "../components/captain/MyRoster.jsx";

export default function CaptainPage() {
  const { ready, user } = useAuth();
  const { team, setTeam, clearTeam } = useTeamSession();
  const { draft, loading, availablePlayers, rosterByTeam } = useDraft();
  const { makePick } = useDraftActions();

  const [selectedTeam, setSelectedTeam] = useState(null); // 핀 입력 전 고른 팀
  const [pinError, setPinError] = useState("");
  const [pinBusy, setPinBusy] = useState(false);

  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };

  const verifyPin = async (pin) => {
    if (!selectedTeam) return;
    setPinBusy(true);
    setPinError("");
    try {
      const snap = await getDoc(doc(db, "draft", "secrets"));
      const ok = await verifyTeamPin(
        pin,
        selectedTeam,
        snap.exists() ? snap.data() : null,
      );
      if (ok) setTeam(selectedTeam);
      else setPinError("핀번호가 올바르지 않습니다.");
    } catch {
      setPinError("확인 중 오류가 발생했습니다.");
    } finally {
      setPinBusy(false);
    }
  };

  if (!ready || !user || loading) return <Spinner label="연결 중…" />;

  // ── 입장 게이트: ① 팀 선택 → ② 해당 팀 핀 입력 ──
  if (!team) {
    if (!selectedTeam) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-slate-100 px-6">
          <div className="flex flex-col items-center gap-2">
            <img src={logo} alt="Rendezvous" className="h-20 w-20 object-contain" />
            <h1 className="text-xl font-extrabold text-navy">대표자 입장</h1>
            <p className="text-sm text-slate-500">어느 팀 대표이신가요?</p>
          </div>
          <div className="flex w-full max-w-xs flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(TEAM.A);
                setPinError("");
              }}
              className="rounded-2xl border-2 border-navy bg-navy py-5 text-xl font-extrabold text-white active:bg-navy-dark"
            >
              {teamNames[TEAM.A]} 대표
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedTeam(TEAM.B);
                setPinError("");
              }}
              className="rounded-2xl border-2 border-brand-red bg-white py-5 text-xl font-extrabold text-brand-red active:bg-brand-red/10"
            >
              {teamNames[TEAM.B]} 대표
            </button>
          </div>
          <Link to="/" className="text-xs text-slate-400 hover:text-navy">
            현황 페이지로
          </Link>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-slate-100 px-6">
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="Rendezvous" className="h-16 w-16 object-contain" />
          <TeamBadge team={selectedTeam} name={teamNames[selectedTeam]} size="lg" />
          <h1 className="mt-1 text-lg font-extrabold text-navy">대표자 핀 입력</h1>
          <p className="text-sm text-slate-500">
            관리자에게 받은 4자리 핀번호를 입력하세요.
          </p>
        </div>
        <PinPad onSubmit={verifyPin} error={pinError} busy={pinBusy} />
        <button
          type="button"
          onClick={() => {
            setSelectedTeam(null);
            setPinError("");
          }}
          className="text-sm text-slate-400 hover:text-navy"
        >
          ← 팀 다시 선택
        </button>
      </div>
    );
  }

  return <CaptainBoard {...{ team, draft, loading, availablePlayers, rosterByTeam, makePick, clearTeam }} />;
}

function CaptainBoard({
  team,
  draft,
  loading,
  availablePlayers,
  rosterByTeam,
  makePick,
  clearTeam,
}) {
  const { isMyTurn, justBecameMyTurn, clearTrigger } = useMyTurn(draft, team);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!isMyTurn) setActivated(false);
  }, [isMyTurn]);

  if (loading) return <Spinner />;

  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };
  const myName = teamNames[team];
  const enabled = isMyTurn && activated;

  const startPicking = () => {
    setActivated(true);
    clearTrigger();
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-100 px-4 pb-10">
      <header className="sticky top-0 z-30 -mx-4 mb-3 flex items-center justify-between bg-navy px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-8 w-8 rounded-full bg-white/90 p-0.5" />
          <TeamBadge team={team} name={myName} />
        </div>
        <button
          type="button"
          onClick={clearTeam}
          className="text-xs text-white/70 hover:text-white"
        >
          나가기
        </button>
      </header>

      <div className="space-y-4">
        <TurnIndicator draft={draft} myTeam={team} teamNames={teamNames} />

        {isMyTurn && !activated && draft?.status === STATUS.LIVE && (
          <button
            type="button"
            onClick={startPicking}
            className="w-full rounded-xl bg-brand-red py-3.5 text-lg font-bold text-white active:bg-brand-red-dark"
          >
            선수 선택하기
          </button>
        )}

        <PlayerPickList
          players={availablePlayers}
          enabled={enabled}
          onPick={(playerId) => makePick(playerId, team)}
          positions={draft?.positions || []}
          teamPosCount={draft?.posCount?.[team] || {}}
        />

        <MyRoster team={team} picks={rosterByTeam[team]} />
      </div>

      <YourTurnModal
        open={justBecameMyTurn && isMyTurn}
        team={team}
        teamName={myName}
        round={draft?.currentRound}
        onStart={startPicking}
      />
    </div>
  );
}
