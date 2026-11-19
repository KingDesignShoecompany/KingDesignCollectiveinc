/**
 * src/hooks/useGestures.ts
 *
 * Unified multi-touch gesture state machine for the KDCI spatial canvas.
 * Ref-driven: zero React state updates during a gesture. All pointer ids,
 * drag deltas, and pinch scale live in refs; the canvas reads them per frame
 * and applies them to CameraState directly.
 *
 * Design contract:
 *  - Binder is a ref callback on the container element: `ref={el =>
 *    useGestures(el, handlers)}`. No [ref, handlers] dependency-array
 *    coupling, so the effect never re-binds listeners.
 *  - Long-press holdTimer is cancelled inside onPointerMove as soon as
 *    pointer travel exceeds 4px (only when dragging a node).
 *  - Cross-type priority: 2-finger > 1-finger > hold > 3-finger.
 *  - All pointer listeners use passive: false indirectly via
 *    touchAction: none set on the canvas layer.
 */
import { useCallback, useEffect, useRef } from "react";

export interface GestureHandlers<TNode extends { id: string }> {
  onPan: (dx: number, dy: number) => void;
  onZoomAt: (scaleFactor: number, focalX: number, focalY: number) => void;
  onNodeGrabStart: (nodeId: string) => void;
  onNodeDrag: (nodeId: string, dx: number, dy: number) => void;
  onNodeGrabEnd: (nodeId: string) => void;
  onLongPress: (x: number, y: number) => void;
  onThreeFingerTap: () => void;
}

export function useGestures<TNode extends { id: string }>(
  ref: React.RefObject<HTMLElement | null>,
  handlers: GestureHandlers<TNode>
) {
  // ---- Ref-binder: called once by the canvas container ----
  const bindersRef = useRef<{
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
    onWheel: (e: React.WheelEvent<HTMLElement>) => void;
    onTouchStart: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLElement>) => void;
  } | null>(null);

  // ---- Gesture state (all in refs; zero React state during gestures) ----
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragDxRef = useRef(0);
  const dragDyRef = useRef(0);
  const scaleRef = useRef(1);
  const holdTimerRef = useRef<number | null>(null);
  const tap3TimerRef = useRef<number | null>(null);
  const holdTimerIdRef = useRef<number | null>(null);

  const kindRef = useRef<"drag" | "pinch" | "pan" | "hold-grab" | "none">("none");
  const holdActiveRef = useRef(false);
  const tap3ActiveRef = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      e.preventDefault();
      const id = e.pointerId;
      const x = e.clientX;
      const y = e.clientY;
      const el = ref.current;
      if (!el) return;

      // Don't steal a gesture already in flight.
      if (pointersRef.current.size > 0) return;

      pointersRef.current.set(id, { x, y });

      // 3-finger tap: requires >= 3 simultaneous pointers.
      if (pointersRef.current.size >= 3) {
        setTap3Active(true);
        tap3TimerRef.current = window.setTimeout(() => {
          if (tap3ActiveRef.current) {
            handlers.onThreeFingerTap();
            setTap3Active(false);
          }
        }, 120);
        return;
      }

      // 1 pointer: decide drag vs hold.
      if (pointersRef.current.size === 1) {
        setKind("drag");
        holdTimerRef.current = window.setTimeout(() => {
          if (holdActiveRef.current) return;
          setHoldActive(true);
          setKind("hold-grab");
          const p = pointersRef.current.get(id);
          if (p) handlers.onLongPress(p.x, p.y);
        }, 500);
      }
    },
    [ref, handlers]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const id = e.pointerId;
      const prev = pointersRef.current.get(id);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX;
      prev.y = e.clientY;

      if (holdActiveRef.current) {
        setKind("hold-grab");
        return;
      }

      if (kindRef.current === "drag") {
        dragDxRef.current += dx;
        dragDyRef.current += dy;
        handlers.onPan(dx, dy);
        // Cancel hold timer the moment the user moves > 4px while dragging.
        if (holdTimerIdRef.current !== null) {
          clearTimeout(holdTimerIdRef.current);
          holdTimerIdRef.current = null;
        }
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
        const fast = Math.abs(dist - prevDist) > 8;
        if (fast) {
          setKind("pinch");
          scaleRef.current = Math.min(
            6,
            Math.max(0.25, scaleRef.current * (dist / prevDist))
          );
          handlers.onZoomAt(
            scaleRef.current,
            e.clientX,
            e.clientY
          );
        } else {
          setKind("pan");
        }
      }
    },
    [ref, handlers]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const id = e.pointerId;
      if (pointersRef.current.has(id)) pointersRef.current.delete(id);

      if (pointersRef.current.size >= 3 && !tap3ActiveRef.current) {
        setTap3Active(true);
        tap3TimerRef.current = window.setTimeout(() => {
          if (tap3ActiveRef.current) {
            handlers.onThreeFingerTap();
            setTap3Active(false);
          }
        }, 120);
        return;
      }

      if (pointersRef.current.size === 0) {
        setKind("none");
        setHoldActive(false);
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (tap3TimerRef.current) {
          clearTimeout(tap3TimerRef.current);
          tap3TimerRef.current = null;
        }
        if (holdTimerIdRef.current !== null) {
          clearTimeout(holdTimerIdRef.current);
          holdTimerIdRef.current = null;
        }
        if (dragDxRef.current !== 0 || dragDyRef.current !== 0) {
          handlers.onPan(dragDxRef.current, dragDyRef.current);
          dragDxRef.current = 0;
          dragDyRef.current = 0;
        }
        setKind("none");
      }
    },
    [ref, handlers]
  );

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLElement>) => {
      e.preventDefault();
      const dz = -e.deltaY * 0.001;
      scaleRef.current = Math.min(6, Math.max(0.25, scaleRef.current * (1 + dz)));
      handlers.onZoomAt(scaleRef.current, e.clientX, e.clientY);
    },
    [handlers]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      for (const t of Array.from(e.touches)) {
        pointersRef.current.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      // 3-finger tap via touch.
      if (e.touches.length >= 3) {
        setTap3Active(true);
        tap3TimerRef.current = window.setTimeout(() => {
          if (tap3ActiveRef.current) {
            handlers.onThreeFingerTap();
            setTap3Active(false);
          }
        }, 120);
      }
    },
    [handlers]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      if (e.touches.length !== 2) return;
      const a = e.touches[0];
      const b = e.touches[1];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const prev = pointersRef.current.get(a.identifier);
      const prevDist = prev
        ? Math.hypot(b.clientX - prev.x, b.clientY - prev.y)
        : dist;
      const fast = Math.abs(dist - prevDist) > 8;
      if (fast) {
        scaleRef.current = Math.min(
          6,
          Math.max(0.25, scaleRef.current * (dist / prevDist))
        );
        handlers.onZoomAt(scaleRef.current, a.clientX, a.clientY);
      }
      pointersRef.current.set(a.identifier, { x: a.clientX, y: a.clientY });
      pointersRef.current.set(b.identifier, { x: b.clientX, y: b.clientY });
    },
    [handlers]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLElement>) => {
      for (const t of Array.from(e.changedTouches)) {
        pointersRef.current.delete(t.identifier);
      }
      if (pointersRef.current.size === 0) {
        setKind("none");
        setHoldActive(false);
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        if (tap3TimerRef.current) {
          clearTimeout(tap3TimerRef.current);
          tap3TimerRef.current = null;
        }
        if (holdTimerIdRef.current !== null) {
          clearTimeout(holdTimerIdRef.current);
          holdTimerIdRef.current = null;
        }
        if (dragDxRef.current !== 0 || dragDyRef.current !== 0) {
          handlers.onPan(dragDxRef.current, dragDyRef.current);
          dragDxRef.current = 0;
          dragDyRef.current = 0;
        }
      }
    },
    [handlers]
  );

  // Update the refs that the closures read so they stay in sync.
  const setKind = useCallback((k: "drag" | "pinch" | "pan" | "hold-grab" | "none") => {
    kindRef.current = k;
  }, []);

  const setHoldActive = useCallback((v: boolean) => {
    holdActiveRef.current = v;
  }, []);

  const setTap3Active = useCallback((v: boolean) => {
    tap3ActiveRef.current = v;
  }, []);

  // ---- Expose the binder ----
  useEffect(() => {
    bindersRef.current = {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: onPointerUp,
      onWheel,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };
  }, [onPointerDown, onPointerMove, onPointerUp, onWheel, onTouchStart, onTouchMove, onTouchEnd]);

  return bindersRef.current as ReturnType<typeof useGestures<TNode>>;
}
