import logo from "../../assets/logo.png";

export default function Logo({ className = "", size = 40, withText = false }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logo}
        alt="Rendezvous"
        width={size}
        height={size}
        className="object-contain drop-shadow-sm"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="leading-tight">
          <div className="font-display text-lg font-extrabold text-navy">
            Rendezvous
          </div>
          <div className="text-[11px] font-semibold tracking-wide text-slate-500">
            청백전 드래프트
          </div>
        </div>
      )}
    </div>
  );
}
