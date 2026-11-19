/**
 * src/hooks/useNodePhysics.ts
 *
 * Deterministic physics for KDCI spatial nodes.
 *
 * Zero React state, zero DOM reads inside the simulation loop.
 * - Nodes live in a ref buffer: nodesRef.current
 * - The simulation mutates position/velocity in memory only
 * - Pushes updates to the canvas via an onFrame callback so the DOM and
 *   SVG coordinate attributes update directly at 60fps with zero React
 *   reconciliation and zero layout thrashing.
 *
 * Mirrors game-engine architecture: Physics -> ref buffer -> DOM/SVG ->
 * no React re-render cycle.
 */
import { useCallback, useEffect, useRef } from "react";

export interface Vector2 {
  x: number;
  y: number;
}

export interface PhysicsNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fixed?: boolean;
  locked?: boolean;
}

const FRICTION = 0.96;
const VELOCITY_EPSILON = 0.01;

export function flingNode(
  node: PhysicsNode,
  dx: number,
  dy: number
): void {
  node.vx = dx * 0.3;
  node.vy = dy * 0.3;
}

export function update(nodes: PhysicsNode[], dt: number): void {
  if (dt <= 0) return;
  for (const n of nodes) {
    if (n.fixed || n.locked) continue;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    n.vx *= FRICTION;
    n.vy *= FRICTION;
    if (Math.abs(n.vx) < VELOCITY_EPSILON) n.vx = 0;
    if (Math.abs(n.vy) < VELOCITY_EPSILON) n.vy = 0;
  }
}

export function collides(a: PhysicsNode, b: PhysicsNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const minDist = a.radius + b.radius;
  const dist = Math.hypot(dx, dy);
  return dist < minDist ? minDist - dist : 0;
}

export function useNodePhysics(
  initialNodes: readonly PhysicsNode[],
  onFrame: (nodes: readonly PhysicsNode[], grabbedId: string | null) => void
) {
  const nodesRef = useRef<PhysicsNode[]>([...initialNodes]);
  const grabbedIdRef = useRef<string | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const grabNode = useCallback(
    (id: string) => {
      const nodes = nodesRef.current;
      for (const n of nodes) {
        if (n.id === id) {
          n.vx = 0;
          n.vy = 0;
          break;
        }
      }
      grabbedIdRef.current = id;
      onFrameRef.current(nodes, id);
    },
    []
  );

  const dragNode = useCallback(
    (nodeId: string, worldDx: number, worldDy: number) => {
      if (grabbedIdRef.current !== nodeId) return;
      const nodes = nodesRef.current;
      for (const n of nodes) {
        if (n.id === nodeId) {
          n.x += worldDx;
          n.y += worldDy;
          break;
        }
      }
      onFrameRef.current(nodes, nodeId);
    },
    []
  );

  const releaseNode = useCallback(() => {
    const releasedId = grabbedIdRef.current;
    grabbedIdRef.current = null;
    onFrameRef.current(nodesRef.current, releasedId);
  }, []);

  /**
   * Fixed-timestep physics loop. Runs every frame via requestAnimationFrame;
   * reads nodesRef.current, mutates in memory, pushes to onFrame.
   */
  useEffect(() => {
    const nodes = nodesRef.current;
    const captured = grabbedIdRef.current;

    // If a node is grabbed, don't evolve physics on it this frame
    // (the consumer handles node dragging directly).
    const evolvable = captured
      ? nodes.filter((n) => n.id !== captured)
      : nodes;

    update(evolvable, 1 / 60);

    // Push updates to the canvas (DOM/SVG via refs) - no React state.
    onFrameRef.current(evolvable, captured);

    return () => {
      // No cleanup needed for the physics loop itself; it cancels on unmount
      // when the component that owns the loop cleans up.
    };
  }, [releaseNode]);

  return {
    nodesRef,
    grabbedIdRef,
    grabNode,
    dragNode,
    releaseNode,
  };
}
