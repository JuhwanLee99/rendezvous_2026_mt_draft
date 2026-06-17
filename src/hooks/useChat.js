import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CHAT_COOLDOWN_SECONDS } from "../lib/constants.js";

const NICK_KEY = "rdv_nick";

export function useChat({ enabled = true } = {}) {
  const { user, ready } = useAuth();
  const [messages, setMessages] = useState([]);
  const [nickname, setNickState] = useState(() => {
    try {
      return localStorage.getItem(NICK_KEY) || "";
    } catch {
      return "";
    }
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const q = query(
      collection(db, "chat"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.reverse(); // 오래된→최신
      setMessages(rows);
    });
    return unsub;
  }, [enabled]);

  const setNickname = useCallback((n) => {
    const v = n.slice(0, 20);
    setNickState(v);
    try {
      localStorage.setItem(NICK_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      const t = text.trim();
      if (!t) return;
      if (!ready || !user) throw new Error("연결 중입니다. 잠시만요.");
      if (!nickname.trim()) throw new Error("닉네임을 먼저 설정하세요.");
      setSending(true);
      try {
        const batch = writeBatch(db);
        // 레이트리밋: rate/{uid} 갱신과 메시지를 한 배치로 (쿨다운은 규칙이 강제)
        batch.set(doc(db, "rate", user.uid), {
          lastChatAt: serverTimestamp(),
        });
        batch.set(doc(collection(db, "chat")), {
          nickname: nickname.trim().slice(0, 20),
          text: t.slice(0, 300),
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
        await batch.commit();
      } catch (e) {
        // 규칙 거부(쿨다운/권한) → 사용자 메시지로 변환
        throw new Error(
          `메시지를 보낼 수 없습니다. ${CHAT_COOLDOWN_SECONDS}초 후 다시 시도하세요.`,
          { cause: e },
        );
      } finally {
        setSending(false);
      }
    },
    [ready, user, nickname],
  );

  return { messages, sendMessage, nickname, setNickname, sending };
}
