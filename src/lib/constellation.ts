/**
 * Constellation utilities
 * - computeCardPosition: region-based anchor + spiral offset + culture bias
 * - densityForPerformance: simple mapping
 */
export function computeCardPosition(
  card: { id: string; type?: string; region?: string; index?: number },
  signals: any,
  viewport: { width: number; height: number }
) {
  const padding = 24;
  const w = viewport.width;
  const h = viewport.height;

  const anchors: Record<string, { x: number; y: number }> = {
    TL: { x: w * 0.18, y: h * 0.18 },
    TR: { x: w * 0.82, y: h * 0.18 },
    C: { x: w * 0.5, y: h * 0.48 },
    BL: { x: w * 0.18, y: h * 0.82 },
    BR: { x: w * 0.82, y: h * 0.82 },
  };

  const region = card.region || "C";
  const anchor = anchors[region];

  const amp = Math.max(0, Math.min(1, signals?.amplitude?.intensity ?? 0.5));
  const spreadBase = 80 + amp * 220;

  const idx = card.index ?? 0;
  const angle = ((idx * 47) % 360) + (signals?.culture?.phase ?? 0);
  const radius = spreadBase * (0.6 + (idx % 5) * 0.18);

  const offsetX = Math.cos((angle * Math.PI) / 180) * radius;
  const offsetY = Math.sin((angle * Math.PI) / 180) * radius * (0.6 + (region === "C" ? 0.2 : 0));

  let x = anchor.x + offsetX;
  let y = anchor.y + offsetY;

  // Apply cultural drift bias
  const cultureBiasX = (signals?.culture?.driftX ?? 0) * 120 * amp;
  const cultureBiasY = (signals?.culture?.driftY ?? 0) * 120 * amp;
  x += cultureBiasX;
  y += cultureBiasY;

  // Clamp to viewport with padding
  x = Math.max(padding, Math.min(w - padding, x));
  y = Math.max(padding, Math.min(h - padding, y));

  return { x, y };
}

export function densityForPerformance(performanceTier: string, amplitude: number) {
  if (performanceTier === "low") return Math.round(12 + amplitude * 8);
  if (performanceTier === "medium") return Math.round(20 + amplitude * 12);
  return Math.round(28 + amplitude * 12);
}

export default { computeCardPosition, densityForPerformance };