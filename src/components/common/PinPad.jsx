import { useState } from "react";

// 4자리 숫자 핀패드 (모바일). onSubmit(pin) → 성공/실패는 부모가 판단.
export default function PinPad({ onSubmit, error, busy }) {
  const [pin, setPin] = useState("");

  const press = (d) => {
    if (busy || pin.length >= 4) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) {
      // 입력 완료 → 제출 후 초기화 (업데이터 밖에서 부수효과 처리)
      Promise.resolve(onSubmit?.(next)).finally(() => setPin(""));
    }
  };
  const back = () => setPin((p) => p.slice(0, -1));

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className={`flex flex-col items-center gap-6 ${error ? "animate-shake" : ""}`}>
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 ${
              i < pin.length
                ? "border-navy bg-navy"
                : "border-slate-300 bg-transparent"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-sm font-semibold text-brand-red">{error}</p>}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            disabled={busy}
            className="h-16 w-16 rounded-full bg-slate-100 text-2xl font-bold text-slate-800 active:bg-navy active:text-white disabled:opacity-50"
          >
            {k}
          </button>
        ))}
        <span />
        <button
          type="button"
          onClick={() => press("0")}
          disabled={busy}
          className="h-16 w-16 rounded-full bg-slate-100 text-2xl font-bold text-slate-800 active:bg-navy active:text-white disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          disabled={busy}
          className="h-16 w-16 rounded-full text-base font-semibold text-slate-500 active:text-navy disabled:opacity-50"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
