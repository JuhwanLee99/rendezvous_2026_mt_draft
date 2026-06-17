import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useDraft } from "../hooks/useDraft.js";
import { useDraftActions } from "../hooks/useDraftActions.js";
import { STATUS, TEAM } from "../lib/constants.js";
import logo from "../assets/logo.png";
import Spinner from "../components/common/Spinner.jsx";
import AdminLogin from "../components/admin/AdminLogin.jsx";
import SetupPanel from "../components/admin/SetupPanel.jsx";
import DraftControls from "../components/admin/DraftControls.jsx";
import TeamRosterColumn from "../components/status/TeamRosterColumn.jsx";
import PoolBoard from "../components/status/PoolBoard.jsx";
import ResultBoard from "../components/status/ResultBoard.jsx";

export default function AdminPage() {
  const { ready, user, isAdmin, adminSignOut } = useAuth();
  const actions = useDraftActions();
  const { draft, players, picks, loading, availablePlayers, rosterByTeam } =
    useDraft();

  const { ensureDraft } = actions;
  useEffect(() => {
    if (isAdmin) ensureDraft().catch(() => {});
  }, [isAdmin, ensureDraft]);

  if (!ready) return <Spinner label="연결 중…" />;
  if (!isAdmin) {
    const notAdmin = !!user && !user.isAnonymous;
    return <AdminLogin notAdmin={notAdmin} />;
  }

  const status = draft?.status ?? STATUS.SETUP;
  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      <header className="bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-9 w-9 rounded-full bg-white/90 p-0.5" />
            <div className="leading-tight">
              <h1 className="text-lg font-extrabold">관리자</h1>
              <p className="text-[11px] text-white/70">Rendezvous 청백전 드래프트</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-white/80 hover:text-white">
              현황 보기
            </Link>
            <button
              type="button"
              onClick={adminSignOut}
              className="rounded-lg bg-white/15 px-3 py-1.5 font-semibold hover:bg-white/25"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6">
        {loading ? (
          <Spinner />
        ) : (
          <>
            {status === STATUS.DONE && (
              <div className="mb-6">
                <ResultBoard draft={draft} picks={picks} />
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <DraftControls
                draft={draft}
                availablePlayers={availablePlayers}
                actions={actions}
              />
              <SetupPanel
                draft={draft}
                players={players}
                actions={actions}
                locked={status !== STATUS.SETUP}
              />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TeamRosterColumn
                  team={TEAM.A}
                  name={teamNames[TEAM.A]}
                  captainName={draft?.teamA?.captainName}
                  picks={rosterByTeam[TEAM.A]}
                  highlight={status === STATUS.LIVE && draft?.currentPicker === TEAM.A}
                />
                <TeamRosterColumn
                  team={TEAM.B}
                  name={teamNames[TEAM.B]}
                  captainName={draft?.teamB?.captainName}
                  picks={rosterByTeam[TEAM.B]}
                  highlight={status === STATUS.LIVE && draft?.currentPicker === TEAM.B}
                />
              </div>
              <PoolBoard players={players} teamNames={teamNames} />
            </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
