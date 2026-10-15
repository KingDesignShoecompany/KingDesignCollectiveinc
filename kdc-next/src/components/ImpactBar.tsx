export default function ImpactBar({ label, pct, value }: { label: string; pct: number; value?: string }) {
  return (
    <div className="impact-bar">
      <div className="ib-head"><span>{label}</span><b>{value ?? pct + '%'}</b></div>
      <div className="ib-track"><div className="ib-fill" style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} /></div>
    </div>
  );
}
