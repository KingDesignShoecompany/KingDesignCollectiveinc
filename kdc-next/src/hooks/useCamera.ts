/**
 * useCamera.ts
 *
 * Camera state for the KDCI spatial canvas. Holds the absolute camera
 * position (x, y) and zoom, exposes transform output for CSS, and a spring
 * interpolation target for smooth frame-rate-independent movement.
 *
 * The canvas renders a hardware-accelerated translate3d(x, y, 0) + scale(zoom)
 * on the .node-layer and .connection-layer so gesture deltas map directly to
 * visual transforms without layout thrashing.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  /** Transform for the node layer (inverse camera = pan in the direction dragged). */
  nodeTransform: string;
  /** Transform for the SVG connection layer (same, shared). */
  connTransform: string;
  /** Spring interpolation velocities. */
  vx: number;
  vy: number;
  vz: number;
  /** Tick dry-run so consumers avoid double-observing state. */
  step(dt: number): void;
  /** Reset to origin. */
  reset: () => void;
  /** Zoom to the given factor around a focal point (x, y) in canvas coords. */
  pinchZoom(factor: number, focalX: number, focalY: number): void;
  /** One-shot spring-smooth move to a target pixel offset. */
  moveTo(x: number, y: number): void;
}

const DEFAULT: CameraState = {
  x: 0,
  y: 0,
  zoom: 1,
  targetX: 0,
  targetY: 0,
  targetZoom: 1,
  vx: 0,
  vy: 0,
  vz: 0,
  nodeTransform: 'translate3d(0px, 0px, 0)',
  connTransform: 'translate3d(0px, 0px, 0)',
  step: () => {},
  reset: () => {},
  pinchZoom: () => {},
  moveTo: () => {},
};

const EASE = 0.14;
const ZOOM_EASE = 0.12;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 6;

function spring(p: number, v: number, t: number, dt: number): { p: number; v: number } {
  const a = t - p;
  const dv = a * EASE * dt;
  v += dv;
  p += v * dt;
  return { p, v };
}

const CameraContext = createContext<CameraState | null>(null);

export function useCamera(): CameraState {
  const [state, setState] = useState<CameraState>(DEFAULT);

  const xRef = useRef(0);
  const yRef = useRef(0);
  const zoomRef = useRef(1);
  const vxRef = useRef(0);
  const vyRef = useRef(0);
  const vzRef = useRef(0);
  const targetXRef = useRef(0);
  const targetYRef = useRef(0);
  const targetZoomRef = useRef(1);

  const setValue = useCallback((next: Partial<CameraState>) => {
    setState((prev) => {
      const nx = next.x ?? prev.x;
      const ny = next.y ?? prev.y;
      const nz = next.zoom ?? prev.zoom;
      return {
        ...prev,
        ...next,
        nodeTransform: `translate3d(${-nx}px, ${-ny}px, 0) scale(${nz})`,
        connTransform: `translate3d(${-nx}px, ${-ny}px, 0) scale(${nz})`,
      };
    });
  }, []);

  useEffect(() => {
    xRef.current = state.x;
    yRef.current = state.y;
    zoomRef.current = state.zoom;
    targetXRef.current = state.targetX;
    targetYRef.current = state.targetY;
    targetZoomRef.current = state.targetZoom;
    vxRef.current = state.vx;
    vyRef.current = state.vy;
    vzRef.current = state.vz;
  }, [state]);

  useEffect(() => {
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let { targetX, targetY, targetZoom } = state;
      let { x, y, zoom } = state;

      const { p: nx, v: nvx } = spring(x, vxRef.current, targetX, dt);
      const { p: ny, v: nvy } = spring(y, vyRef.current, targetY, dt);

      const zTarget = targetZoom;
      const zOut = zoom + (zTarget - zoom) * ZOOM_EASE * dt;
      const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zOut));

      setValue({ x: nx, y: ny, zoom: nz, targetX, targetY, targetZoom, vx: nvx, vy: nvy });
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [setValue]);

  const step = useCallback(
    (dt: number) => {
      let { targetX, targetY, targetZoom } = state;
      let { x, y, zoom } = state;
      const { p: nx, v: nvx } = spring(x, vxRef.current, targetX, dt);
      const { p: ny, v: nvy } = spring(y, vyRef.current, targetY, dt);
      const zTarget = targetZoom;
      const zOut = zoom + (zTarget - zoom) * ZOOM_EASE * dt;
      const nz = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zOut));
      return { x: nx, y: ny, zoom: nz, targetX, targetY, targetZoom, vx: nvx, vy: nvy };
    },
    [state],
  );

  const reset = useCallback(() => {
    setValue({ x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1 });
  }, [setValue]);

  const moveTo = useCallback(
    (x: number, y: number) => {
      targetXRef.current = x;
      targetYRef.current = y;
      setValue({ targetX: x, targetY: y });
    },
    [setValue],
  );

  const pinchZoom = useCallback(
    (factor: number, focalX: number, focalY: number) => {
      const z = zoomRef.current;
      const newZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z * factor));
      const sX = focalX * z + xRef.current;
      const sY = focalY * z + yRef.current;
      const newX = sX - focalX * newZoom;
      const newY = sY - focalY * newZoom;
      zoomRef.current = newZoom;
      xRef.current = newX;
      yRef.current = newY;
      setValue({ targetZoom: newZoom, targetX: newX, targetY: newY, zoom: newZoom, x: newX, y: newY });
    },
    [setValue],
  );

  return {
    x: xRef.current,
    y: yRef.current,
    zoom: zoomRef.current,
    targetX: targetXRef.current,
    targetY: targetYRef.current,
    targetZoom: targetZoomRef.current,
    vx: vxRef.current,
    vy: vyRef.current,
    vz: vzRef.current,
    nodeTransform: `translate3d(${-xRef.current}px, ${-yRef.current}px, 0) scale(${zoomRef.current})`,
    connTransform: `translate3d(${-xRef.current}px, ${-yRef.current}px, 0) scale(${zoomRef.current})`,
    step,
    reset,
    pinchZoom,
    moveTo,
  };
}

export { CameraContext, DEFAULT };
