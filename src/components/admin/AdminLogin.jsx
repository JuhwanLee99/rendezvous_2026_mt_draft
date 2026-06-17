import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import logo from "../../assets/logo.png";

export default function AdminLogin({ notAdmin }) {
  const { adminSignIn, adminSignOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminSignIn(email, password);
    } catch {
      setError("로그인 실패 — 이메일/비밀번호를 확인하세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg"
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src={logo} alt="" className="h-16 w-16 object-contain" />
          <h1 className="text-lg font-extrabold text-navy">관리자 로그인</h1>
        </div>
        {notAdmin && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            이 계정은 관리자 권한이 없습니다.{" "}
            <button
              type="button"
              onClick={adminSignOut}
              className="font-semibold underline"
            >
              다른 계정으로 로그인
            </button>
          </p>
        )}
        <label className="mb-1 block text-sm font-medium text-slate-600">
          이메일
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-navy focus:outline-none"
        />
        <label className="mb-1 block text-sm font-medium text-slate-600">
          비밀번호
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-navy focus:outline-none"
        />
        {error && <p className="mb-4 text-sm text-brand-red">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-navy py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </div>
  );
}
