export type Kpi = { icon: string; value: string; label: string; delta: string };
export default function PageKpis({ items }: { items: Kpi[] }) {
  return (
    <div className="kpi-grid">
      {items.map((k) => (
        <div className="glass-card kpi-card" key={k.label}>
          <div className="kpi-top"><span className="kpi-ico">{k.icon}</span><span className="kpi-label">{k.label}</span></div>
          <div className="kpi-value">{k.value}</div>
          <span className="kpi-delta">{k.delta}</span>
        </div>
      ))}
    </div>
  );
}
