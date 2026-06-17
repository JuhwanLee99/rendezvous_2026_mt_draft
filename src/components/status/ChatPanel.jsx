import { useEffect, useRef, useState } from "react";
import { useChat } from "../../hooks/useChat.js";

export default function ChatPanel() {
  const { messages, sendMessage, nickname, setNickname, sending } = useChat();
  const [draftNick, setDraftNick] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

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

      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-4 py-3"
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
