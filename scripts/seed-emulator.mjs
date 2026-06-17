// 실행 중인 에뮬레이터에 데모 데이터 시드 (UI 스모크용). 규칙 무시하고 직접 기록.
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { teamForPick, roundForPick, teamPicksBefore } from "../src/lib/draftEngine.js";

const testEnv = await initializeTestEnvironment({
  projectId: "demo-rdv",
  firestore: { host: "127.0.0.1", port: 8080 },
});

const NAMES = ["김민수","이정후","박해민","오지환","강백호","문동주","구자욱",
  "나성범","양의지","김광현","류현진","안우진"];
const firstPick = "A";
const poolSize = NAMES.length;
const madePicks = 5;

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  // players
  for (let i = 0; i < poolSize; i++) {
    const picked = i < madePicks;
    await setDoc(doc(db, "players", `p${i}`), {
      name: NAMES[i],
      order: i,
      status: picked ? "picked" : "available",
      pickedBy: picked ? teamForPick(i, firstPick) : null,
      pickIndex: picked ? i : null,
    });
  }
  // picks
  for (let i = 0; i < madePicks; i++) {
    const team = teamForPick(i, firstPick);
    await setDoc(doc(db, "picks", String(i)), {
      index: i,
      round: roundForPick(i),
      team,
      teamPickIndex: teamPicksBefore(i, firstPick, team),
      playerId: `p${i}`,
      playerName: NAMES[i],
      pickedByUid: "seed",
      createdAt: serverTimestamp(),
    });
  }
  // draft state (live, 다음 차례)
  await setDoc(doc(db, "draft", "state"), {
    status: "live",
    firstPick,
    pickCount: madePicks,
    poolSize,
    currentRound: roundForPick(madePicks),
    currentPicker: teamForPick(madePicks, firstPick),
    youtubeVideoId: null,
    teamA: { name: "청룡", captainName: "주장A" },
    teamB: { name: "백호", captainName: "주장B" },
  });
  // 채팅 샘플
  await setDoc(doc(db, "chat", "s1"), {
    nickname: "야구사랑", text: "청룡 화이팅! 🔥", uid: "seed", createdAt: serverTimestamp(),
  });
  await setDoc(doc(db, "chat", "s2"), {
    nickname: "직관러", text: "이번 픽 기대된다", uid: "seed", createdAt: serverTimestamp(),
  });
});

await testEnv.cleanup();
console.log("seeded ✓");
process.exit(0);
