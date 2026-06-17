// Firestore 보안 규칙 + 픽/undo 플로우 검증 (에뮬레이터).
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
} from "firebase/firestore";
import { readFileSync } from "node:fs";

const ADMIN = "admin-test-uid";
let rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
rules = rules.replace("'REPLACE_WITH_ADMIN_UID'", `'${ADMIN}'`);

const testEnv = await initializeTestEnvironment({
  projectId: "rdv-draft-test",
  firestore: { rules, host: "127.0.0.1", port: 8080 },
});

const admin = testEnv.authenticatedContext(ADMIN);
const capA = testEnv.authenticatedContext("cap-a");
const capB = testEnv.authenticatedContext("cap-b");
const viewer = testEnv.unauthenticatedContext();
const anon = testEnv.authenticatedContext("anon-viewer"); // 익명(=signed-in)

let passed = 0;
let failed = 0;
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

async function seedLive({ poolSize = 3, firstPick = "A", currentPicker = "A", pickCount = 0 } = {}) {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "draft", "state"), {
      status: "live",
      firstPick,
      pickCount,
      poolSize,
      currentRound: Math.floor(pickCount / 2) + 1,
      currentPicker,
      youtubeVideoId: null,
      teamA: { name: "청", captainName: "a" },
      teamB: { name: "백", captainName: "b" },
    });
    for (let i = 0; i < poolSize; i++) {
      await setDoc(doc(db, "players", `p${i}`), {
        name: `선수${i}`,
        order: i,
        status: "available",
        pickedBy: null,
        pickIndex: null,
      });
    }
  });
}

async function seedSetup() {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "draft", "state"), {
      status: "setup",
      firstPick: "A",
      pickCount: 0,
      poolSize: 0,
      currentRound: 0,
      currentPicker: null,
      youtubeVideoId: null,
      teamA: { name: "", captainName: "" },
      teamB: { name: "", captainName: "" },
    });
  });
}

// 픽 배치 빌더 (makePick 의 쓰기셋과 동일 형태)
function pickBatch(db, { pid, index, team, nextPicker, uid, complete = false }) {
  const batch = writeBatch(db);
  batch.update(doc(db, "players", pid), {
    status: "picked",
    pickedBy: team,
    pickIndex: index,
  });
  batch.set(doc(db, "picks", String(index)), {
    index,
    round: Math.floor(index / 2) + 1,
    team,
    teamPickIndex: 0,
    playerId: pid,
    playerName: "x",
    pickedByUid: uid,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "draft", "state"), {
    pickCount: index + 1,
    currentRound: Math.floor((index + 1) / 2) + 1,
    currentPicker: complete ? null : nextPicker,
    status: complete ? "done" : "live",
  });
  return batch;
}

console.log("\n── 권한/설정 ──");
await t("관전자(anon)도 draft/state 읽기 가능", async () => {
  await seedLive();
  await assertSucceeds(getDoc(doc(anon.firestore(), "draft", "state")));
});
await t("비관리자는 players 생성 불가", async () => {
  await seedSetup();
  await assertFails(
    setDoc(doc(capA.firestore(), "players", "x"), {
      name: "x", order: 0, status: "available", pickedBy: null, pickIndex: null,
    }),
  );
});
await t("관리자는 setup 단계에서 players 생성 가능", async () => {
  await seedSetup();
  await assertSucceeds(
    setDoc(doc(admin.firestore(), "players", "x"), {
      name: "x", order: 0, status: "available", pickedBy: null, pickIndex: null,
    }),
  );
});
await t("secrets: 관리자 쓰기 OK / 익명 읽기 OK / 미인증 읽기 거부", async () => {
  await seedSetup();
  await assertSucceeds(
    setDoc(doc(admin.firestore(), "draft", "secrets"), { pinHashA: "h" }),
  );
  await assertSucceeds(getDoc(doc(anon.firestore(), "draft", "secrets")));
  await assertFails(getDoc(doc(viewer.firestore(), "draft", "secrets")));
});

console.log("\n── 픽 흐름 (스네이크, A 선픽) ──");
await t("현재 차례 팀(A)의 정상 픽 성공", async () => {
  await seedLive({ poolSize: 3, currentPicker: "A" });
  await assertSucceeds(
    pickBatch(capA.firestore(), {
      pid: "p0", index: 0, team: "A", nextPicker: "B", uid: "cap-a",
    }).commit(),
  );
});
await t("상대 차례(A)인데 B로 픽 시도 → 거부 (차례 강제)", async () => {
  await seedLive({ poolSize: 3, currentPicker: "A" });
  await assertFails(
    pickBatch(capB.firestore(), {
      pid: "p0", index: 0, team: "B", nextPicker: "A", uid: "cap-b",
    }).commit(),
  );
});
await t("잘못된 순번(index=5, pickCount=0) → 거부", async () => {
  await seedLive({ poolSize: 6, currentPicker: "A" });
  await assertFails(
    pickBatch(capA.firestore(), {
      pid: "p5", index: 5, team: "A", nextPicker: "B", uid: "cap-a",
    }).commit(),
  );
});
await t("차기 picker 변조(R1픽 후 currentPicker를 A로) → 거부", async () => {
  await seedLive({ poolSize: 3, currentPicker: "A" });
  // index0 picked by A 이면 다음은 B 여야 하는데 A 로 설정
  await assertFails(
    pickBatch(capA.firestore(), {
      pid: "p0", index: 0, team: "A", nextPicker: "A", uid: "cap-a",
    }).commit(),
  );
});
await t("이미 지명된 선수 재지명 → 거부", async () => {
  await seedLive({ poolSize: 3, currentPicker: "B", pickCount: 1 });
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "players", "p0"), {
      name: "선수0", order: 0, status: "picked", pickedBy: "A", pickIndex: 0,
    });
  });
  await assertFails(
    pickBatch(capB.firestore(), {
      pid: "p0", index: 1, team: "B", nextPicker: "A", uid: "cap-b",
    }).commit(),
  );
});
await t("마지막 픽 → status=done, currentPicker=null 성공", async () => {
  await seedLive({ poolSize: 2, currentPicker: "B", pickCount: 1 });
  await assertSucceeds(
    pickBatch(capB.firestore(), {
      pid: "p1", index: 1, team: "B", nextPicker: null, uid: "cap-b", complete: true,
    }).commit(),
  );
});
await t("관리자 undo: 마지막 픽 삭제 가능", async () => {
  await seedLive({ poolSize: 3, currentPicker: "B", pickCount: 1 });
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "picks", "0"), {
      index: 0, round: 1, team: "A", teamPickIndex: 0, playerId: "p0", playerName: "x",
    });
  });
  const { deleteDoc } = await import("firebase/firestore");
  await assertSucceeds(deleteDoc(doc(admin.firestore(), "picks", "0")));
});
await t("비관리자는 픽 삭제(undo) 불가", async () => {
  await seedLive({ poolSize: 3, currentPicker: "B", pickCount: 1 });
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "picks", "0"), {
      index: 0, round: 1, team: "A", teamPickIndex: 0, playerId: "p0", playerName: "x",
    });
  });
  const { deleteDoc } = await import("firebase/firestore");
  await assertFails(deleteDoc(doc(capA.firestore(), "picks", "0")));
});

console.log("\n── 채팅/접속 ──");
await t("정상 채팅(rate+메시지 배치) 성공", async () => {
  await seedLive();
  const db = anon.firestore();
  const b = writeBatch(db);
  b.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  b.set(doc(db, "chat", "m1"), {
    nickname: "닉", text: "안녕", uid: "anon-viewer", createdAt: serverTimestamp(),
  });
  await assertSucceeds(b.commit());
});
await t("연속 채팅(쿨다운 내) → 거부", async () => {
  await seedLive();
  const db = anon.firestore();
  const first = writeBatch(db);
  first.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  first.set(doc(db, "chat", "m1"), {
    nickname: "닉", text: "1", uid: "anon-viewer", createdAt: serverTimestamp(),
  });
  await first.commit();
  const second = writeBatch(db);
  second.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  second.set(doc(db, "chat", "m2"), {
    nickname: "닉", text: "2", uid: "anon-viewer", createdAt: serverTimestamp(),
  });
  await assertFails(second.commit());
});
await t("300자 초과 채팅 → 거부", async () => {
  await seedLive();
  const db = anon.firestore();
  const b = writeBatch(db);
  b.set(doc(db, "rate", "anon-viewer"), { lastChatAt: serverTimestamp() });
  b.set(doc(db, "chat", "m1"), {
    nickname: "닉", text: "x".repeat(301), uid: "anon-viewer", createdAt: serverTimestamp(),
  });
  await assertFails(b.commit());
});
await t("presence 본인 문서 쓰기 OK", async () => {
  await seedLive();
  await assertSucceeds(
    setDoc(doc(anon.firestore(), "presence", "c1"), {
      uid: "anon-viewer", lastSeen: serverTimestamp(), page: "status",
    }),
  );
});
await t("presence 남의 uid 로 쓰기 → 거부", async () => {
  await seedLive();
  await assertFails(
    setDoc(doc(anon.firestore(), "presence", "c1"), {
      uid: "someone-else", lastSeen: serverTimestamp(), page: "status",
    }),
  );
});

await testEnv.cleanup();
console.log(`\n결과: ${passed} 통과 / ${failed} 실패\n`);
process.exit(failed ? 1 : 0);
