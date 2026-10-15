import { ringDash } from './charts';
export default function ProgressRing({ pct, label, size = 64 }: { pct: number; label?: string; size?: number }) {
  const { dash, gap } = ringDash(pct);
  return (
    <div className="ring-wrap" style={{ width: size }}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
        <circle cx="24" cy="24" r="20" fill="none" stroke="var(--gold)" strokeWidth="4"
          strokeDasharray={`${dash} ${gap}`} strokeLinecap="round" transform="rotate(-90 24 24)" />
      </svg>
      <div className="ring-center">{Math.round(pct)}%</div>
      {label && <div className="ring-label">{label}</div>}
    </div>
  );
}
