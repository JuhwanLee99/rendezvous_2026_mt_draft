import { useEffect, useRef, useState } from "react";
import { TEAM, POSITION_CAP } from "../../lib/constants.js";
import { formatGameDateTime, normalizeGameDateTime } from "../../lib/gameDateTime.js";
import { parseYouTubeId } from "../../lib/youtube.js";

const parsePositions = (s) =>
  s.split(",").map((x) => x.trim()).filter(Boolean);

const parsePlayers = (text) =>
  text
    .split("\n")
    .map((line) => {
      const parts = line.split(",");
      return { name: (parts[0] || "").trim(), position: (parts[1] || "").trim() };
    })
    .filter((p) => p.name);

export default function SetupPanel({ draft, players, actions, locked }) {
  const [teamAName, setTeamAName] = useState("");
  const [captainA, setCaptainA] = useState("");
  const [teamBName, setTeamBName] = useState("");
  const [captainB, setCaptainB] = useState("");
  const [firstPick, setFirstPick] = useState(TEAM.A);
  const [pinA, setPinA] = useState("");
  const [pinB, setPinB] = useState("");
  const [gameDateTime, setGameDateTime] = useState("");
  const [positionsText, setPositionsText] = useState("");
  const [playersText, setPlayersText] = useState("");
  const [youtube, setYoutube] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const inited = useRef(false);
  const playersInited = useRef(false);

  useEffect(() => {
    if (inited.current || !draft) return;
    inited.current = true;
    setTeamAName(draft.teamA?.name || "");
    setCaptainA(draft.teamA?.captainName || "");
    setTeamBName(draft.teamB?.name || "");
    setCaptainB(draft.teamB?.captainName || "");
    setFirstPick(draft.firstPick || TEAM.A);
    setGameDateTime(normalizeGameDateTime(draft.gameDateTime));
    setYoutube(draft.youtubeVideoId || "");
    setPositionsText((draft.positions || []).join(", "));
  }, [draft]);

  useEffect(() => {
    if (players?.length && !playersInited.current) {
      playersInited.current = true;
      setPlayersText(
        players.map((p) => `${p.name},${p.position || ""}`).join("\n"),
      );
    }
  }, [players]);

  const positions = parsePositions(positionsText);
  const parsed = parsePlayers(playersText);
  const invalid = parsed.filter(
    (p) => !p.position || !positions.includes(p.position),
  );
  const posSummary = positions.map((pos) => ({
    pos,
    count: parsed.filter((p) => p.position === pos).length,
  }));
  const ytId = parseYouTubeId(youtube);

  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      await actions.saveConfig({
        teamA: { name: teamAName.trim(), captainName: captainA.trim() },
        teamB: { name: teamBName.trim(), captainName: captainB.trim() },
        firstPick,
        gameDateTime,
        youtube,
        positions,
      });
      await actions.setPlayers(parsed);
      const pins = {};
      if (/^\d{4}$/.test(pinA)) pins.pinA = pinA;
      if (/^\d{4}$/.test(pinB)) pins.pinB = pinB;
      if (pins.pinA || pins.pinB) await actions.setPins(pins);
      setPinA("");
      setPinB("");
      setMsg("저장되었습니다 ✓");
    } catch (e) {
      setMsg(`저장 실패: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-navy">드래프트 설정</h2>
      {locked && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          드래프트 진행 중에는 설정을 변경할 수 없습니다. 변경하려면 먼저 리셋하세요.
        </p>
      )}

      <fieldset disabled={locked || busy} className="space-y-6">
        {/* 팀 정보 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TeamBox title="청팀 (A)" name={teamAName} setName={setTeamAName} captain={captainA} setCaptain={setCaptainA} pin={pinA} setPin={setPinA} />
          <TeamBox title="백팀 (B)" name={teamBName} setName={setTeamBName} captain={captainB} setCaptain={setCaptainB} pin={pinB} setPin={setPinB} />
        </div>

        <div>
          <label htmlFor="game-date-time" className="mb-1.5 block text-sm font-medium text-slate-600">
            경기 날짜 및 시작 시간
          </label>
          <input
            id="game-date-time"
            type="datetime-local"
            step="60"
            value={gameDateTime}
            onChange={(e) => setGameDateTime(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none sm:max-w-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            {gameDateTime
              ? `이미지 표시: ${formatGameDateTime(gameDateTime)}`
              : "선택하면 요일·날짜·시간이 최종 명단 이미지에 표시됩니다."}
          </p>
        </div>

        {/* 선픽 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            1라운드 먼저 지명할 팀
          </label>
          <div className="flex gap-2">
            {[TEAM.A, TEAM.B].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFirstPick(t)}
                className={`flex-1 rounded-lg border px-4 py-2.5 font-semibold ${
                  firstPick === t
                    ? "border-navy bg-navy text-white"
                    : "border-slate-300 bg-white text-slate-600"
                }`}
              >
                {t === TEAM.A ? teamAName || "청팀" : teamBName || "백팀"} 먼저
              </button>
            ))}
          </div>
        </div>

        {/* 포지션 목록 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            포지션 목록 (콤마로 구분) — 팀당 포지션별 최대 {POSITION_CAP}명
          </label>
          <input
            value={positionsText}
            onChange={(e) => setPositionsText(e.target.value)}
            placeholder="투수, 포수, 내야수, 외야수"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
          />
          {positions.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {posSummary.map((s) => `${s.pos} ${s.count}명`).join(" · ")}
            </p>
          )}
        </div>

        {/* 선수 풀 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            참가 선수 (한 줄에 <b>이름,포지션</b>) — {parsed.length}명
          </label>
          <textarea
            value={playersText}
            onChange={(e) => setPlayersText(e.target.value)}
            rows={9}
            placeholder={"홍길동,투수\n김철수,포수\n이영희,외야수\n…"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-navy focus:outline-none"
          />
          {invalid.length > 0 && (
            <p className="mt-1 text-xs text-brand-red">
              ⚠️ 포지션이 비었거나 목록에 없는 선수 {invalid.length}명:{" "}
              {invalid.slice(0, 5).map((p) => p.name).join(", ")}
              {invalid.length > 5 ? " …" : ""}
            </p>
          )}
        </div>

        {/* 유튜브 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            YouTube 라이브 URL / 영상 ID
          </label>
          <input
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
            placeholder="https://youtube.com/live/… 또는 영상 ID"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-400">
            {youtube
              ? ytId
                ? `인식된 영상 ID: ${ytId}`
                : "⚠️ 영상 ID를 인식하지 못했습니다."
              : "비워두면 현황 페이지에 '방송 준비중'으로 표시됩니다."}
          </p>
        </div>
      </fieldset>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={locked || busy}
          className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "저장 중…" : "설정 저장"}
        </button>
        {msg && <span className="text-sm text-slate-600">{msg}</span>}
      </div>
    </section>
  );
}

function TeamBox({ title, name, setName, captain, setCaptain, pin, setPin }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-3 font-bold text-slate-700">{title}</h3>
      <label className="mb-1 block text-xs font-medium text-slate-500">팀 이름</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
      />
      <label className="mb-1 block text-xs font-medium text-slate-500">대표 이름</label>
      <input
        value={captain}
        onChange={(e) => setCaptain(e.target.value)}
        className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
      />
      <label className="mb-1 block text-xs font-medium text-slate-500">
        접속 핀번호 (4자리)
      </label>
      <input
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
        inputMode="numeric"
        placeholder="변경 시에만 입력"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest focus:border-navy focus:outline-none"
      />
    </div>
  );
}
