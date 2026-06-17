import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, ADMIN_UIDS } from "../lib/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
      // 로그인 사용자가 없으면 익명 로그인 (대표/관전자/픽 쓰기에 필요)
      if (!u) {
        signInAnonymously(auth).catch((e) =>
          console.error("anon sign-in failed", e),
        );
      }
    });
    return unsub;
  }, []);

  const isAdmin = !!user && !user.isAnonymous && ADMIN_UIDS.includes(user.uid);

  const adminSignIn = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // 관리자 로그아웃 → onAuthStateChanged 가 다시 익명 로그인시킴
  const adminSignOut = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, ready, isAdmin, adminSignIn, adminSignOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
