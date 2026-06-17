import { Link } from "react-router-dom";
import { useDraft } from "../hooks/useDraft.js";
import { usePresence } from "../hooks/usePresence.js";
import { useNewPickAnnouncement } from "../hooks/useNewPickAnnouncement.js";
import { STATUS, TEAM } from "../lib/constants.js";
import logo from "../assets/logo.png";
import Spinner from "../components/common/Spinner.jsx";
import ViewerCount from "../components/status/ViewerCount.jsx";
import YouTubeLivePane from "../components/status/YouTubeLivePane.jsx";
import PoolBoard from "../components/status/PoolBoard.jsx";
import TeamRosterColumn from "../components/status/TeamRosterColumn.jsx";
import ChatPanel from "../components/status/ChatPanel.jsx";
import PickAnnouncementModal from "../components/status/PickAnnouncementModal.jsx";

export default function StatusPage() {
  const { draft, players, picks, loading, rosterByTeam } = useDraft();
  const { viewerCount } = usePresence("status");
  const { latestPick, dismiss } = useNewPickAnnouncement(picks);

  if (loading) return <Spinner label="드래프트 현황 불러오는 중…" />;

  const teamNames = {
    [TEAM.A]: draft?.teamA?.name || "청팀",
    [TEAM.B]: draft?.teamB?.name || "백팀",
  };
  const status = draft?.status ?? STATUS.SETUP;
  const currentPicker = status === STATUS.LIVE ? draft?.currentPicker : null;

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-navy text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Rendezvous"
              className="h-9 w-9 rounded-full bg-white/90 p-0.5"
            />
            <div className="leading-tight">
              <h1 className="text-base font-extrabold sm:text-lg">
                Rendezvous 청백전 드래프트
              </h1>
              <p className="text-[11px] text-white/70">실시간 현황</p>
            </div>
          </div>
          <ViewerCount count={viewerCount} />
        </div>

        {/* 스코어보드 */}
        <div className="mx-auto flex max-w-6xl items-stretch gap-2 px-4 pb-3">
          <ScoreCard
            label={teamNames[TEAM.A]}
            count={rosterByTeam[TEAM.A].length}
            tone="A"
            active={currentPicker === TEAM.A}
          />
          <div className="flex items-center px-1 text-sm font-bold text-white/60">
            {status === STATUS.LIVE
              ? `R${draft?.currentRound ?? ""}`
              : status === STATUS.DONE
                ? "종료"
                : "대기"}
          </div>
          <ScoreCard
            label={teamNames[TEAM.B]}
            count={rosterByTeam[TEAM.B].length}
            tone="B"
            active={currentPicker === TEAM.B}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 pt-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <YouTubeLivePane videoId={draft?.youtubeVideoId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TeamRosterColumn
              team={TEAM.A}
              name={teamNames[TEAM.A]}
              captainName={draft?.teamA?.captainName}
              picks={rosterByTeam[TEAM.A]}
              highlight={currentPicker === TEAM.A}
            />
            <TeamRosterColumn
              team={TEAM.B}
              name={teamNames[TEAM.B]}
              captainName={draft?.teamB?.captainName}
              picks={rosterByTeam[TEAM.B]}
              highlight={currentPicker === TEAM.B}
            />
          </div>
          <PoolBoard players={players} teamNames={teamNames} />
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-36">
            <ChatPanel />
          </div>
        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-6xl px-4 text-center text-xs text-slate-400">
        <Link to="/team" className="hover:text-navy">
          대표자 입장
        </Link>
        <span className="mx-2">·</span>
        <Link to="/admin" className="hover:text-navy">
          관리자
        </Link>
      </footer>

      <PickAnnouncementModal
        pick={latestPick}
        teamName={latestPick ? teamNames[latestPick.team] : ""}
        onClose={dismiss}
      />
    </div>
  );
}

function ScoreCard({ label, count, tone, active }) {
  const isA = tone === "A";
  return (
    <div
      className={`flex flex-1 items-center justify-between rounded-xl px-3 py-2 ${
        isA ? "bg-white/10" : "bg-white/10"
      } ${active ? "ring-2 ring-white" : ""}`}
    >
      <span className="truncate text-sm font-bold">
        <span className={isA ? "text-ice" : "text-red-200"}>●</span> {label}
      </span>
      <span className="text-xl font-black">{count}</span>
    </div>
  );
}
