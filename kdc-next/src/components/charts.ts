export function sparkPoints(values: number[], W: number, H: number) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => ({
    x: (i / Math.max(1, values.length - 1)) * W,
    y: H - ((v - min) / span) * H,
  }));
}

export function ringDash(pct: number) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, pct));
  return { dash: (clamped / 100) * circ, gap: circ };
}
