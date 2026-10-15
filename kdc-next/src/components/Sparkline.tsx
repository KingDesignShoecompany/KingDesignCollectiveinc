import { sparkPoints } from './charts';
export default function Sparkline({ values, width = 80, height = 28 }: { values: number[]; width?: number; height?: number }) {
  const pts = sparkPoints(values, width, height);
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden><path d={d} fill="none" stroke="var(--gold)" strokeWidth={1.5} /></svg>;
}
