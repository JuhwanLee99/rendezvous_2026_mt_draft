export default function Spinner({ label = "불러오는 중…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-navy" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
