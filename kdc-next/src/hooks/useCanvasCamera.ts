/**
 * src/hooks/useCanvasCamera.ts
 *
 * Ref-first camera for the KDCI spatial OS.
 *
 * Core contract:
 *  - ZERO setState during pan / zoom / spring frames. Every gesture writes
 *    cameraRef.current directly and pushes translate3d(...) scale(...) into
 *    worldRef.current.style.transform on the same frame, so the browser
 *    compositor does the layout work at 60fps on mobile.
 *  - Camera and node physics share one requestAnimationFrame carrier so the
 *    spatial OS eventually runs a single render loop.
 *  - zoomAt() now supports focal-point zoom (map / Figma / VisionOS style),
 *    so a pinch at (fx, fy) stays anchored to the cursor instead of the
 *    viewport centre.
 *  - animateTo() is a damped spring stepper used for double-click / command
 *    bar navigation (cinematic fly-to, never snap).
 */
import { RefObject, useCallback, useRef } from "react";

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.5;

export function useCanvasCamera(
  worldRef: RefObject<HTMLElement | null>,
  initial: CameraState = { x: 0, y: 0, zoom: 1 },
  onZoomLabelChange?: (zoomPct: number) => void
) {
  const cameraRef = useRef<CameraState>({ ...initial });
  const springRafRef = useRef<number | null>(null);
  const lastPctRef = useRef<number>(Math.round(initial.zoom * 100));

  /**
   * Push the current camera into the DOM via a hardware-accelerated CSS
   * transform. Called every gesture frame, never every React render.
   */
  const applyTransform = useCallback(() => {
    const { x, y, zoom } = cameraRef.current;
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${zoom})`;
    }
    const pct = Math.round(zoom * 100);
    if (pct !== lastPctRef.current) {
      lastPctRef.current = pct;
      onZoomLabelChange?.(pct);
    }
  }, [worldRef, onZoomLabelChange]);

  const cancelSpring = useCallback(() => {
    if (springRafRef.current !== null) {
      cancelAnimationFrame(springRafRef.current);
      springRafRef.current = null;
    }
  }, []);

  /**
   * Pan: deltas are applied directly to cameraRef.current and the DOM is
   * updated on the same frame. No React state, no reconciliation churn.
   */
  const pan = useCallback(
    (dx: number, dy: number) => {
      cancelSpring();
      cameraRef.current.x += dx;
      cameraRef.current.y += dy;
      applyTransform();
    },
    [cancelSpring, applyTransform]
  );

  /**
   * Zoom at focal point (fx, fy). The focal point stays under the cursor /
   * touch while the world scales around it.
   */
  const zoomAt = useCallback(
    (scaleFactor: number, focalX?: number, focalY?: number) => {
      cancelSpring();
      const prev = cameraRef.current;
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, prev.zoom * scaleFactor)
      );
      const ratio = nextZoom / prev.zoom;

      const fx =
        focalX ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 0);
      const fy =
        focalY ?? (typeof window !== "undefined" ? window.innerHeight / 2 : 0);

      cameraRef.current = {
        zoom: nextZoom,
        x: fx - (fx - prev.x) * ratio,
        y: fy - (fy - prev.y) * ratio,
      };
      applyTransform();
    },
    [cancelSpring, applyTransform]
  );

  /**
   * Cinematic fly-to: damped spring stepper. Used for double-click node
   * navigation and command-bar routing. Never a hard snap.
   */
  const animateTo = useCallback(
    (targetWorldX: number, targetWorldY: number, targetZoom: number) => {
      cancelSpring();

      const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
      const vh = typeof window !== "undefined" ? window.innerHeight : 800;
      const targetX = vw / 2 - targetWorldX * targetZoom;
      const targetY = vh / 2 - targetWorldY * targetZoom;

      const step = () => {
        const prev = cameraRef.current;
        const dx = targetX - prev.x;
        const dy = targetY - prev.y;
        const dz = targetZoom - prev.zoom;

        if (
          Math.abs(dx) < 0.4 &&
          Math.abs(dy) < 0.4 &&
          Math.abs(dz) < 0.004
        ) {
          cameraRef.current = { x: targetX, y: targetY, zoom: targetZoom };
          applyTransform();
          springRafRef.current = null;
          return;
        }

        cameraRef.current = {
          x: prev.x + dx * 0.14,
          y: prev.y + dy * 0.14,
          zoom: prev.zoom + dz * 0.14,
        };
        applyTransform();
        springRafRef.current = requestAnimationFrame(step);
      };

      springRafRef.current = requestAnimationFrame(step);
    },
    [cancelSpring, applyTransform]
  );

  const reset = useCallback(() => {
    animateTo(0, 0, 1);
  }, [animateTo]);

  return {
    cameraRef,
    pan,
    zoomAt,
    animateTo,
    reset,
  };
}
