import { useLayoutEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat.js";

const NEAR_BOTTOM_PX = 40;

export default function ChatPanel() {
  const { messages, sendMessage, nickname, setNickname, sending } = useChat();
  const [draftNick, setDraftNick] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const [newCount, setNewCount] = useState(0);

  const listRef = useRef(null);
  const atBottomRef = useRef(true); // 렌더 중 최신값 참조용 (스크롤 이벤트로 갱신)
  const prevLen = useRef(0);
  const first = useRef(true);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setNewCount(0);
  };

  // 새 메시지 반영 시: 맨 아래면 따라가고, 위로 올려둔 상태면 위치 유지 + 새 메시지 카운트
  useLayoutEffect(() => {
    const added = messages.length - prevLen.current;
    prevLen.current = messages.length;
    if (first.current) {
      first.current = false;
      scrollToBottom();
      return;
    }
    if (atBottomRef.current) {
      scrollToBottom(); // 하단에 있으면 최신으로 따라감
    } else if (added > 0) {
      setNewCount((c) => c + added); // 위로 올려둔 상태 → 위치 유지, 알림만
    }
  }, [messages]);

  const jumpToLatest = () => {
    atBottomRef.current = true;
    setAtBottom(true);
    setNewCount(0);
    scrollToBottom();
  };

  const hasNick = !!nickname.trim();

  const submitNick = (e) => {
    e.preventDefault();
    if (draftNick.trim()) setNickname(draftNick.trim());
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const t = text.trim();
    if (!t) return;
    try {
      await sendMessage(t);
      setText("");
      jumpToLatest(); // 내가 보내면 최신으로 이동
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="flex h-full flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-lg font-bold text-navy">응원 채팅</h2>
        {hasNick && (
          <button
            type="button"
            onClick={() => setNickname("")}
            className="text-xs text-slate-400 hover:text-navy"
          >
            {nickname} ✎
          </button>
        )}
      </div>

      <div className="relative flex-1">
        <div
          ref={listRef}
          onScroll={onScroll}
          data-testid="chat-list"
          className="h-full space-y-2 overflow-y-auto px-4 py-3"
          style={{ minHeight: 160, maxHeight: 360 }}
        >
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              첫 메시지를 남겨보세요!
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-bold text-navy">{m.nickname}</span>
                <span className="ml-2 break-words text-slate-700">{m.text}</span>
              </div>
            ))
          )}
        </div>

        {!atBottom && (
          <button
            type="button"
            onClick={jumpToLatest}
            data-testid="chat-jump"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-navy px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:bg-navy-dark"
          >
            {newCount > 0 ? `새 메시지 ${newCount}개` : "맨 아래로"}
            <span aria-hidden="true">↓</span>
          </button>
        )}
      </div>

      {!hasNick ? (
        <form onSubmit={submitNick} className="border-t border-slate-100 p-3">
          <p className="mb-2 text-xs text-slate-500">채팅에 쓸 닉네임을 정하세요</p>
          <div className="flex gap-2">
            <input
              value={draftNick}
              onChange={(e) => setDraftNick(e.target.value.slice(0, 20))}
              placeholder="닉네임 (최대 20자)"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white"
            >
              입장
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit} className="border-t border-slate-100 p-3">
          {error && <p className="mb-1.5 text-xs text-brand-red">{error}</p>}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              placeholder="메시지 입력…"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="shrink-0 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              전송
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
