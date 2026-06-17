import { useEffect, useRef, useState } from "react";
import { STATUS } from "../lib/constants.js";

// 내 팀 차례인지 + false→true 전환 감지(팝업 트리거).
export function useMyTurn(draft, myTeam) {
  const isMyTurn =
    !!myTeam &&
    draft?.status === STATUS.LIVE &&
    draft?.currentPicker === myTeam;

  const [justBecameMyTurn, setJustBecameMyTurn] = useState(false);
  const prev = useRef(false);

  useEffect(() => {
    if (isMyTurn && !prev.current) {
      setJustBecameMyTurn(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
    prev.current = isMyTurn;
  }, [isMyTurn]);

  const clearTrigger = () => setJustBecameMyTurn(false);

  return { isMyTurn, justBecameMyTurn, clearTrigger };
}
