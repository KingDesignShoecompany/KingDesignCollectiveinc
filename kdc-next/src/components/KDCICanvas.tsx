'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useCanvasCamera } from '../hooks/useCanvasCamera';
import { useGestures } from '../hooks/useGestures';
import { useNodePhysics } from '../hooks/useNodePhysics';
import '../styles/canvas.css';

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

export interface KDCINode extends PhysicsNode {
  title: string;
  sectorTag: string;
  route: string;
  health: number;
  projects: number;
  agents: number;
  status: 'active' | 'growth' | 'research' | 'incubation' | 'gap';
  isDeclaredGap?: boolean;
}

export interface EcosystemLink {
  source: string;
  target: string;
  type: 'data' | 'supports' | 'treasury';
}

interface Props {
  initialNodes: KDCINode[];
  links: EcosystemLink[];
  onNavigate: (route: string) => void;
  onOpenCommandBar?: () => void;
  onContextMenuAt?: (x: number, y: number, nodeId?: string) => void;
}

export default function KDCICanvas({
  initialNodes,
  links,
  onNavigate,
  onOpenCommandBar,
  onContextMenuAt,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const nodeDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineDomRefs = useRef<Map<number, SVGLineElement>>(new Map());

  const [selectedId, setSelectedId] = useState<string>(
    initialNodes[0]?.id ?? 'kdci-core'
  );
  const [zoomPct, setZoomPct] = useState<number>(100);

  const { cameraRef, pan, zoomAt, animateTo, reset } = useCanvasCamera(
    worldRef,
    { x: 0, y: 0, zoom: 1 },
    setZoomPct
  );

  const syncFrameToDom = useCallback(
    (liveNodes: readonly PhysicsNode[], grabbedId: string | null) => {
      const nodeMap = new Map<string, PhysicsNode>();
      for (const node of liveNodes) {
        nodeMap.set(node.id, node);
        const el = nodeDomRefs.current.get(node.id);
        if (el) {
          el.style.transform = `translate3d(${node.x - node.radius}px, ${
            node.y - node.radius
          }px, 0)`;
          el.classList.toggle('is-grabbed', grabbedId === node.id);
        }
      }
      links.forEach((link, idx) => {
        const lineEl = lineDomRefs.current.get(idx);
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (lineEl && src && tgt) {
          lineEl.setAttribute('x1', String(src.x));
          lineEl.setAttribute('y1', String(src.y));
          lineEl.setAttribute('x2', String(tgt.x));
          lineEl.setAttribute('y2', String(tgt.y));
        }
      });
    },
    [links]
  );

  const { nodesRef, grabNode, dragNode, releaseNode } = useNodePhysics(
    initialNodes,
    syncFrameToDom
  );

  const gestureHandlersRef = useRef<{
    onPan: (dx: number, dy: number) => void;
    onZoomAt: (scaleFactor: number, focalX: number, focalY: number) => void;
    onNodeGrabStart: (nodeId: string) => void;
    onNodeDrag: (nodeId: string, dx: number, dy: number) => void;
    onNodeGrabEnd: (nodeId: string) => void;
    onLongPress: (x: number, y: number) => void;
    onThreeFingerTap: () => void;
  } | null>(null);

  gestureHandlersRef.current = {
    onPan: pan,
    onZoomAt: zoomAt,
    onNodeGrabStart: (id) => {
      setSelectedId(id);
      grabNode(id);
    },
    onNodeDrag: dragNode,
    onNodeGrabEnd: () => {
      releaseNode();
    },
    onLongPress: (x, y) => {
      onContextMenuAt?.(x, y);
    },
    onThreeFingerTap: () => {
      onOpenCommandBar?.();
    },
  };

  useGestures(containerRef, gestureHandlersRef.current as any);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
    onContextMenuAt?.(e.clientX, e.clientY, nodeEl?.dataset.nodeId);
  };

  return (
    <div
      ref={containerRef}
      className="kdci-canvas"
      onContextMenu={handleContextMenu}
    >
      <div className="grid-layer" />

      <div className="desktop-hud-bar">
        <span className="hud-brand">KDCI OS // SPATIAL ECOSYSTEM</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="hud-cmd-btn" onClick={reset}>
            RESET VIEW ({zoomPct}%)
          </button>
          {onOpenCommandBar && (
            <button className="hud-cmd-btn" onClick={onOpenCommandBar}>
              ⌘K COMMAND
            </button>
          )}
        </div>
      </div>

      <div
        ref={worldRef}
        className="world-layer"
        style={{ transform: 'translate3d(0px, 0px, 0) scale(1)' }}
      >
        <svg className="connection-layer" width="4000" height="4000">
          {links.map((link, idx) => {
            const src = nodesRef.current.find((n) => n.id === link.source);
            const tgt = nodesRef.current.find((n) => n.id === link.target);
            if (!src || !tgt) return null;
            return (
              <line
                key={`${link.source}-${link.target}-${idx}`}
                ref={(el) => {
                  if (el) lineDomRefs.current.set(idx, el);
                  else lineDomRefs.current.delete(idx);
                }}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                className={`gold-stream-line stream-${link.type}`}
              />
            );
          })}
        </svg>

        {nodesRef.current.map((node: PhysicsNode) => {
          const kcni = node as KDCINode;
          return (
            <div
              key={node.id}
              ref={(el) => {
                if (el) nodeDomRefs.current.set(node.id, el);
                else nodeDomRefs.current.delete(node.id);
              }}
              data-node-id={node.id}
              className={`holo-node status-${kcni.status} ${
                selectedId === node.id ? 'selected' : ''
              }`}
              style={{
                transform: `translate3d(${node.x - node.radius}px, ${
                  node.y - node.radius
                }px, 0)`,
                width: node.radius * 2,
                height: node.radius * 2,
              }}
              onClick={() => setSelectedId(node.id)}
              onDoubleClick={() => {
                if (kcni.isDeclaredGap) return;
                animateTo(node.x, node.y, 2.5);
                setTimeout(() => onNavigate(kcni.route), 420);
              }}
            >
              <div className="orbit-ring" />
              <div className="node-core">
                <span className="node-sector">{kcni.sectorTag}</span>
                <span className="node-title">{kcni.title}</span>
                <span className="node-meta">
                  {kcni.isDeclaredGap
                    ? 'DECLARED GAP (404)'
                    : `${kcni.projects}P · ${kcni.agents}A`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
