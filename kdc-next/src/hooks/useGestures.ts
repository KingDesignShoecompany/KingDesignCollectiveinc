/**
 * useGestures.ts
 *
 * Unified multi-touch gesture state machine for the KDCI spatial canvas.
 * Combines pointer drag, 500ms hold-to-grab, 2-finger pinch-to-zoom,
 * 2-finger pan, and 3-finger tap (command center) without letting
 * cross-type conflicts break the render loop.
 *
 * Design contract:
 *  - One active pointer set per gesture type. Cross-type priority:
 *    2-finger > 1-finger > hold > 3-finger.
 *  - All pointer listeners use passive: false so preventDefault() works for
 *    touch-action: none on the canvas layer.
 *  - Returns a flat gesture delta bag the canvas applies each frame to the
 *    CameraState (dx, dy pan deltas; scale pinch factor; holdToGrab flag).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type PointerId = number;
export type GestureKind = 'drag' | 'pinch' | 'pan' | 'hold-grab' | 'tap-3' | 'none';

export interface GestureDelta {
  /** Pixels dragged in the last frame (x, y). */
  dx: number;
  dy: number;
  /** Current pinch scale factor. */
  scale: number;
  /** Accumulator for hold-to-grab idle pan (synthetic pan from hold). */
  holdX: number;
  holdY: number;
  /** True when a 500ms hold is active. */
  holdActive: boolean;
  /** True when a 3-finger tap is active. */
  tap3Active: boolean;
  /** Current gesture kind. */
  kind: GestureKind;
  /** Raw pointer ids currently tracked. */
  pointers: PointerId[];
  /** True when at least one pointer is down. */
  isPanning: boolean;
  /** True while wheel capture is allowed. */
  allowWheel: boolean;
}

const HOLD_TIMEOUT = 500;
const TAP3_TIMEOUT = 120;

interface PointerEntry {
  x: number;
  y: number;
}

/**
 * Unified multi-touch gesture state machine.
 *
 * Parameters:
 *  - onHoldStart   called at 500ms hold, gives (x, y) grab origin.
 *  - onHoldEnd     called on hold release, reports the synthetic pan offset.
 *  - onCommand3Tap called on a 3-finger tap (command center).
 *
 * Returns a delta bag the canvas applies to CameraState each frame.
 */
export function useGestures(
  onHoldStart: (x: number, y: number) => void,
  onHoldEnd: (x: number, y: number) => void,
  onCommand3Tap: () => void,
) {
  const pointersRef = useRef<Map<PointerId, PointerEntry>>(new Map());
  const [scale, setScale] = useState(1);
  const [holdX, setHoldX] = useState(0);
  const [holdY, setHoldY] = useState(0);
  const [holdActive, setHoldActive] = useState(false);
  const [tap3Active, setTap3Active] = useState(false);
  const [kind, setKind] = useState<GestureKind>('none');
  const [isPanning, setIsPanning] = useState(false);
  const [allowWheel, setAllowWheel] = useState(true);

  const dragDxRef = useRef(0);
  const dragDyRef = useRef(0);
  const [dragDx, setDragDx] = useState(0);
  const [dragDy, setDragDy] = useState(0);

  const holdTimerRef = useRef<number | null>(null);
  const tap3TimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (tap3TimerRef.current) clearTimeout(tap3TimerRef.current);
    };
  }, []);

  // ---- Pointer down ----
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const id = e.pointerId;
      const x = e.clientX;
      const y = e.clientY;

      // Don't steal a gesture already in flight.
      if (kind === 'pinch' || kind === 'pan' || kind === 'drag' || holdActive || tap3Active) return;

      pointersRef.current.set(id, { x, y });

      // 3-finger tap: requires >= 3 simultaneous pointers.
      if (pointersRef.current.size >= 3) {
        setTap3Active(true);
        tap3TimerRef.current = window.setTimeout(() => {
          if (tap3Active) {
            onCommand3Tap();
            setTap3Active(false);
          }
        }, TAP3_TIMEOUT);
        return;
      }

      // 1 pointer: decide drag vs hold.
      if (pointersRef.current.size === 1) {
        setKind('drag');
        setAllowWheel(true);
        holdTimerRef.current = window.setTimeout(() => {
          if (holdActive) return;
          setHoldActive(true);
          setKind('hold-grab');
          const p = pointersRef.current.get(id);
          if (p) onHoldStart(p.x, p.y);
        }, HOLD_TIMEOUT);
      }
    },
    [kind, holdActive, onHoldStart, onCommand3Tap, tap3Active],
  );

  // ---- Pointer move ----
  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const id = e.pointerId;
      const prev = pointersRef.current.get(id);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;

      if (holdActive) {
        setKind('hold-grab');
        setHoldX((h) => h + dx);
        setHoldY((h) => h + dy);
        return;
      }

      if (kind === 'drag') {
        setKind('drag');
        dragDxRef.current += dx;
        dragDyRef.current += dy;
        return;
      }

      // 2 pointers -> may be pinch or pan.
      if (pointersRef.current.size >= 2) {
        const ids = Array.from(pointersRef.current.keys());
        const a = pointersRef.current.get(ids[0])!;
        const b = pointersRef.current.get(ids[1])!;
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const prevDist = prev
          ? Math.hypot(b.x - prev.x, b.y - prev.y)
          : dist;
        // A fast distance change => pinch zoom; a slow change => 2-finger pan.
        const fast = Math.abs(dist - prevDist) > 8;
        if (fast) {
          setKind('pinch');
          setScale((s) => {
            const f = dist / prevDist;
            return Math.min(6, Math.max(0.25, s * f));
          });
          setAllowWheel(false);
          window.setTimeout(() => setAllowWheel(true), 120);
        } else {
          setKind('pan');
          setIsPanning(true);
        }
      }
    },
    [kind, holdActive, onCommand3Tap],
  );

  // ---- Pointer up ----
  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const id = e.pointerId;
      const had = pointersRef.current.has(id);
      if (had) pointersRef.current.delete(id);

      if (pointersRef.current.size >= 3 && !tap3Active) {
        setTap3Active(true);
        tap3TimerRef.current = window.setTimeout(() => {
          if (tap3Active) {
            onCommand3Tap();
            setTap3Active(false);
          }
        }, TAP3_TIMEOUT);
        return;
      }

      if (pointersRef.current.size === 0) {
        setKind('none');
        setHoldActive(false);
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (tap3TimerRef.current) {
          clearTimeout(tap3TimerRef.current);
          tap3TimerRef.current = null;
        }
        if (onHoldEnd) {
          onHoldEnd(holdX, holdY);
        }
        setHoldX(0);
        setHoldY(0);
        setKind('none');
      }
    },
    [pointersRef, tap3Active, onCommand3Tap, onHoldEnd, holdX, holdY],
  );

  // ---- Wheel (2-finger pan / zoom out) ----
  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!allowWheel) return;
      e.preventDefault();
      const dz = -e.deltaY * 0.001;
      setScale((s) => Math.min(6, Math.max(0.25, s * (1 + dz))));
      setAllowWheel(false);
      window.setTimeout(() => setAllowWheel(true), 120);
    },
    [allowWheel],
  );

  // ---- Exports ----
  const resetDrag = useCallback(() => {
    dragDxRef.current = 0;
    dragDyRef.current = 0;
    setDragDx(0);
    setDragDy(0);
  }, []);

  return {
    delta: {
      dx: dragDxRef.current,
      dy: dragDyRef.current,
      scale,
      holdX,
      holdY,
      holdActive,
      tap3Active,
      kind,
      pointers: Array.from(pointersRef.current.keys()),
      isPanning,
      allowWheel,
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onWheel,
    resetDrag,
    setAllowWheel,
  };
}
