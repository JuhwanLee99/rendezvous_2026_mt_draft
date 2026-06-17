// Firestore 보안 규칙 + 픽/포지션캡/undo 검증 (에뮬레이터).
// 실행: firebase emulators:exec --only firestore "node scripts/test-rules.mjs"
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  getDoc,
  writeBatch,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { emptyPosCount, availByPosFrom } from "../src/lib/draftEngine.js";

const ADMIN = "admin-test-uid";
let rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
// isAdmin() 의 UID 목록을 테스트 UID 로 치환(실제 UID가 들어있어도 무관)
rules = rules.replace(
  /request\.auth\.uid in \[[\s\S]*?\]/,
  `request.auth.uid in ['${ADMIN}']`,
);

const testEnv = await initializeTestEnvironment({
  projectId: "rdv-draft-test",
  firestore: { rules, host: "127.0.0.1", port: 8080 },
});

const admin = testEnv.authenticatedContext(ADMIN);
const capA = testEnv.authenticatedContext("cap-a");
const capB = testEnv.authenticatedContext("cap-b");
const viewer = testEnv.unauthenticatedContext();
const anon = testEnv.authenticatedContext("anon-viewer");

let passed = 0, failed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}\n     ${e.message}`);
  }
}

async function seedLive(opts = {}) {
  const {
    positions = ["P"],
    players = [
      { id: "p0", position: "P" },
      { id: "p1", position: "P" },
      { id: "p2", position: "P" },
    ],
    firstPick = "A",
    currentPicker = "A",
    pickCount = 0,
    slotIndex = 0,
    posCount,
    availByPos,
  } = opts;
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const objs = players.map((p, i) => ({
      id: p.id,
      name: p.name || `선수${i}`,
      position: p.position,
      order: i,
      status: p.status || "available",
      pickedBy: p.pickedBy ?? null,
      pickIndex: p.pickIndex ?? null,
    }));
    await setDoc(doc(db, "draft", "state"), {
      status: "live", firstPick, pickCount, poolSize: players.length, slotIndex,
      currentRound: Math.floor(slotIndex / 2) + 1, currentPicker, youtubeVideoId: null,
      positions,
      posCount: posCount || emptyPosCount(positions),
      availByPos: availByPos || availByPosFrom(objs, positions),
      teamA: { name: "청", captainName: "a" }, teamB: { name: "백", captainName: "b" },
    });
    for (const p of objs) {
      await setDoc(doc(db, "players", p.id), {
        name: p.name, position: p.position, order: p.order,
        status: p.status, pickedBy: p.pickedBy, pickIndex: p.pickIndex,
      });
    }
  });
}

function pickBatch(db, o) {
  const { pid, pos, index, team, nextPicker, uid, complete = false,
    beforePosCount, beforeAvail, slotIndex = 0, round = 1 } = o;
  const newPosCount = {
    ...beforePosCount,
    [team]: { ...beforePosCount[team], [pos]: (beforePosCount[team][pos] || 0) + 1 },
  };
  const newAvail = { ...beforeAvail, [pos]: (beforeAvail[pos] || 0) - 1 };
  const batch = writeBatch(db);
  batch.update(doc(db, "players", pid), { status: "picked", pickedBy: team, pickIndex: index });
  batch.set(doc(db, "picks", String(index)), {
    index, slotIndex, round, team, position: pos, teamPickIndex: 0,
    playerId: pid, playerName: "x", pickedByUid: uid, createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "draft", "state"), {
    pickCount: index + 1, posCount: newPosCount, availByPos: newAvail,
    slotIndex: complete ? slotIndex : slotIndex + 1,
    currentRound: round, currentPicker: complete ? null : nextPicker,
    status: complete ? "done" : "live",
  });
  return batch;
}
const PC0 = { A: { P: 0 }, B: { P: 0 } };

console.log("\n── 권한/설정 ──");
await t("관전자(anon)도 draft/state 읽기 가능", async () => {
  await seedLive();
  await assertSucceeds(getDoc(doc(anon.firestore(), "draft", "state")));
});
await t("관리자 secrets 쓰기 / 익명 읽기 / 미인증 거부", async () => {
  await seedLive();
  await assertSucceeds(setDoc(doc(admin.firestore(), "draft", "secrets"), { pinHashA: "h" }));
  await assertSucceeds(getDoc(doc(anon.firestore(), "draft", "secrets")));
  await assertFails(getDoc(doc(viewer.firestore(), "draft", "secrets")));
});

console.log("\n── 픽 흐름 ──");
await t("현재 차례 팀(A) 정상 픽 성공", async () => {
  await seedLive({ availByPos: { P: 3 } });
  await assertSucceeds(pickBatch(capA.firestore(), {
    pid: "p0", pos: "P", index: 0, team: "A", nextPicker: "B", uid: "cap-a",
    beforePosCount: PC0, beforeAvail: { P: 3 },
  }).commit());
});
await t("상대 차례(A)인데 B로 픽 → 거부", async () => {
  await seedLive({ availByPos: { P: 3 } });
  await assertFails(pickBatch(capB.firestore(), {
    pid: "p0", pos: "P", index: 0, team: "B", nextPicker: "A", uid: "cap-b",
    beforePosCount: PC0, beforeAvail: { P: 3 },
  }).commit());
});
await t("잘못된 순번(index=5, pickCount=0) → 거부", async () => {
  await seedLive({ availByPos: { P: 3 } });
  await assertFails(pickBatch(capA.firestore(), {
    pid: "p2", pos: "P", index: 5, team: "A", nextPicker: "B", uid: "cap-a",
    beforePosCount: PC0, beforeAvail: { P: 3 },
  }).commit());
});
await t("이미 지명된 선수 재지명 → 거부", async () => {
  await seedLive({
    currentPicker: "B", pickCount: 1, slotIndex: 1,
    players: [
      { id: "p0", position: "P", status: "picked", pickedBy: "A", pickIndex: 0 },
      { id: "p1", position: "P" }, { id: "p2", position: "P" },
    ],
    posCount: { A: { P: 1 }, B: { P: 0 } }, availByPos: { P: 2 },
  });
  await assertFails(pickBatch(capB.firestore(), {
    pid: "p0", pos: "P", index: 1, team: "B", nextPicker: "A", uid: "cap-b",
    beforePosCount: { A: { P: 1 }, B: { P: 0 } }, beforeAvail: { P: 2 }, slotIndex: 1,
  }).commit());
});

console.log("\n── 포지션 캡 (팀당 최대 2명) ──");
await t("A가 이미 P 2명 → 3번째 P 픽 거부", async () => {
  await seedLive({
    currentPicker: "A", pickCount: 2, slotIndex: 3,
    players: [
      { id: "p0", position: "P", status: "picked", pickedBy: "A", pickIndex: 0 },
      { id: "p1", position: "P", status: "picked", pickedBy: "A", pickIndex: 1 },
      { id: "p2", position: "P" },
    ],
    posCount: { A: { P: 2 }, B: { P: 0 } }, availByPos: { P: 1 },
  });
  await assertFails(pickBatch(capA.firestore(), {
    pid: "p2", pos: "P", index: 2, team: "A", nextPicker: "B", uid: "cap-a",
    beforePosCount: { A: { P: 2 }, B: { P: 0 } }, beforeAvail: { P: 1 }, slotIndex: 3,
  }).commit());
});
await t("A가 P 2명이어도 B는 P 픽 가능", async () => {
  await seedLive({
    currentPicker: "B", pickCount: 2, slotIndex: 2,
    players: [
      { id: "p0", position: "P", status: "picked", pickedBy: "A", pickIndex: 0 },
      { id: "p1", position: "P", status: "picked", pickedBy: "A", pickIndex: 1 },
      { id: "p2", position: "P" },
    ],
    posCount: { A: { P: 2 }, B: { P: 0 } }, availByPos: { P: 1 },
  });
  await assertSucceeds(pickBatch(capB.firestore(), {
    pid: "p2", pos: "P", index: 2, team: "B", nextPicker: null, uid: "cap-b", complete: true,
    beforePosCount: { A: { P: 2 }, B: { P: 0 } }, beforeAvail: { P: 1 }, slotIndex: 2,
  }).commit());
});

console.log("\n── undo / 채팅 / 접속 ──");
await t("관리자 undo(픽 삭제) 가능 / 비관리자 거부", async () => {
  await seedLive();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "picks", "0"), {
      index: 0, slotIndex: 0, round: 1, team: "A", position: "P",
      teamPickIndex: 0, playerId: "p0", playerName: "x",
    });
  });
  await assertFails(deleteDoc(doc(capA.firestore(), "picks", "0")));
  await assertSucceeds(deleteDoc(doc(admin.firestore(), "picks", "0")));
});
await t("정상 채팅 성공 / 연속(쿨다운) 거부", async () => {
  await seedLive();
  const db = anon.firestore();
  const b1 = writeBatch(db);
  b1.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  b1.set(doc(db, "chat", "m1"), { nickname: "닉", text: "안녕", uid: "anon-viewer", createdAt: serverTimestamp() });
  await assertSucceeds(b1.commit());
  const b2 = writeBatch(db);
  b2.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  b2.set(doc(db, "chat", "m2"), { nickname: "닉", text: "또", uid: "anon-viewer", createdAt: serverTimestamp() });
  await assertFails(b2.commit());
});
await t("presence 본인 OK / 남의 uid 거부", async () => {
  await seedLive();
  await assertSucceeds(setDoc(doc(anon.firestore(), "presence", "c1"), {
    uid: "anon-viewer", lastSeen: serverTimestamp(), page: "status",
  }));
  await assertFails(setDoc(doc(anon.firestore(), "presence", "c2"), {
    uid: "someone-else", lastSeen: serverTimestamp(), page: "status",
  }));
});

await testEnv.cleanup();
console.log(`\n결과: ${passed} 통과 / ${failed} 실패\n`);
process.exit(failed ? 1 : 0);
