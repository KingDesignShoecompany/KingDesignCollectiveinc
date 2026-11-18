/**
 * useNodePhysics.ts
 *
 * Deterministic physics for KDCI spatial nodes. Pure functions over an
 * immutable node array; zero React state, zero DOM reads.
 */

export interface Vector2 {
  x: number;
  y: number;
}

export interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fixed?: boolean;
}

const FRICTION = 0.96;

export function update(nodes: Node[], dt: number): Node[] {
  if (dt <= 0) return nodes;
  return nodes.map((n) => {
    if (n.fixed) return n;
    const ax = -n.vx * FRICTION;
    const ay = -n.vy * FRICTION;
    const nx = n.x + n.vx * dt;
    const ny = n.y + n.vy * dt;
    return { ...n, x: nx, y: ny, vx: n.vx + ax * dt, vy: n.vy + ay * dt };
  });
}

export function collides(a: Node, b: Node): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const minDist = a.radius + b.radius;
  const dist = Math.hypot(dx, dy);
  return dist < minDist ? minDist - dist : 0;
}

export function derivs(n: Node, dt: number): { vx: number; vy: number } {
  return { vx: -n.vx * FRICTION * dt, vy: -n.vy * FRICTION * dt };
}
