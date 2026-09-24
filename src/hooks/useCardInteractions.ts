import { useCallback } from "react";
import { useNavStore } from "../store/navigation";

/**
 * useCardInteractions
 * - Provides handlers for hover, tap, dragEnd
 * - Integrates with global nav store for sidebar highlights
 */
export function useCardInteractions() {
  const setActiveSection = useNavStore((s) => s.setActiveSection);
  const setSignals = useNavStore((s) => s.setSignals);

  const handleHover = useCallback((id: string, enter: boolean, signals?: any) => {
    // Bump hover state in store
    setSignals({ hover: { id: enter ? id : null } });
  }, [setSignals]);

  const handleTap = useCallback((id: string) => {
    // Expand the card: set active section
    setActiveSection("CardExpanded");
  }, [setActiveSection]);

  const handleDragEnd = useCallback((id: string, x: number, y: number, viewport: { width: number; height: number }) => {
    // Compute nearest region
    const regions = {
      TL: { x: viewport.width * 0.18, y: viewport.height * 0.18 },
      TR: { x: viewport.width * 0.82, y: viewport.height * 0.18 },
      C: { x: viewport.width * 0.5, y: viewport.height * 0.48 },
      BL: { x: viewport.width * 0.18, y: viewport.height * 0.82 },
      BR: { x: viewport.width * 0.82, y: viewport.height * 0.82 },
    };
    let best = "C";
    let bestDist = Infinity;
    Object.entries(regions).forEach(([k, v]) => {
      const dx = x - v.x;
      const dy = y - v.y;
      const d = Math.hypot(dx, dy);
      if (d < bestDist) {
        bestDist = d;
        best = k;
      }
    });
    setActiveSection(`Region:${best}`);
    setSignals({ lastDrag: { id, region: best } });
  }, [setActiveSection, setSignals]);

  return { handleHover, handleTap, handleDragEnd };
}

export default useCardInteractions;