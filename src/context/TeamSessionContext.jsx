import { createContext, useContext, useState, useCallback } from "react";

const KEY = "rdv_team"; // sessionStorage: 새로고침 유지, 탭 닫으면 해제

const TeamSessionContext = createContext(null);

export function TeamSessionProvider({ children }) {
  const [team, setTeamState] = useState(() => {
    try {
      const v = sessionStorage.getItem(KEY);
      return v === "A" || v === "B" ? v : null;
    } catch {
      return null;
    }
  });

  const setTeam = useCallback((t) => {
    setTeamState(t);
    try {
      if (t) sessionStorage.setItem(KEY, t);
      else sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clearTeam = useCallback(() => setTeam(null), [setTeam]);

  return (
    <TeamSessionContext.Provider value={{ team, setTeam, clearTeam }}>
      {children}
    </TeamSessionContext.Provider>
  );
}

export function useTeamSession() {
  const ctx = useContext(TeamSessionContext);
  if (!ctx)
    throw new Error("useTeamSession must be used within TeamSessionProvider");
  return ctx;
}
