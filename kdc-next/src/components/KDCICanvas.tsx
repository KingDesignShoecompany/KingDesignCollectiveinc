'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useCanvasCamera } from '../hooks/useCanvasCamera';
import { useGestures } from '../hooks/useGestures';
import { useNodePhysics } from '../hooks/useNodePhysics';
import { RadialMenu, RadialActionId } from './RadialMenu';
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
  links: initialLinks,
  onNavigate,
  onOpenCommandBar,
  onContextMenuAt,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const nodeDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lineDomRefs = useRef<Map<number, SVGLineElement>>(new Map());
  const pulseDomRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  const [selectedId, setSelectedId] = useState<string>(
    initialNodes[0]?.id ?? 'kdci-core'
  );
  const [zoomPct, setZoomPct] = useState<number>(100);

  const [radialState, setRadialState] = useState<{
    visible: boolean;
    x: number;
    y: number;
    nodeId?: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Relationship Graph edge state
  const [edgeLinks, setEdgeLinks] = useState<EcosystemLink[]>(
    initialLinks.length > 0 ? initialLinks : []
  );
  const [pickingSourceNodeId, setPickingSourceNodeId] =
    useState<string | null>(null);

  const { cameraRef, pan, zoomAt, animateTo, clampCamera, fitAll, reset } =
    useCanvasCamera(
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
      edgeLinks.forEach((link, idx) => {
        const lineEl = lineDomRefs.current.get(idx);
        const pulseEl = pulseDomRefs.current.get(idx);
        const src = nodeMap.get(link.source);
        const tgt = nodeMap.get(link.target);
        if (!src || !tgt) return;

        if (lineEl) {
          lineEl.setAttribute('x1', String(src.x));
          lineEl.setAttribute('y1', String(src.y));
          lineEl.setAttribute('x2', String(tgt.x));
          lineEl.setAttribute('y2', String(tgt.y));
        }

        if (pulseEl) {
          const t = (performance.now() * 0.00055 + idx * 0.19) % 1;
          const px = src.x + (tgt.x - src.x) * t;
          const py = src.y + (tgt.y - src.y) * t;
          pulseEl.setAttribute('cx', String(px));
          pulseEl.setAttribute('cy', String(py));
        }
      });
    },
    [edgeLinks]
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
    onNodeGrabEnd: (nodeId) => {
      grabNode(nodeId);
    },
    onLongPress: (x, y) => {
      openRadialAt(x, y);
    },
    onThreeFingerTap: () => {
      onOpenCommandBar?.();
    },
  };

  useGestures(containerRef, gestureHandlersRef.current as any);

  // Fit-to-ecosystem on mount (also wired to HUD RESET VIEW and Radial recenter).
  useEffect(() => {
    fitAll(nodesRef.current);
  }, [fitAll]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('[data-node-id]') as HTMLElement | null;
    onContextMenuAt?.(e.clientX, e.clientY, nodeEl?.dataset.nodeId);
  };

  const openRadialAt = useCallback((clientX: number, clientY: number, explicitNodeId?: string) => {
    let resolvedNodeId = explicitNodeId;
    if (!resolvedNodeId && typeof document !== 'undefined') {
      const hit = document.elementFromPoint(clientX, clientY);
      const nodeEl = hit?.closest('[data-node-id]') as HTMLElement | null;
      resolvedNodeId = nodeEl?.dataset.nodeId;
    }
    if (resolvedNodeId) setSelectedId(resolvedNodeId);
    setRadialState({
      visible: true,
      x: clientX,
      y: clientY,
      nodeId: resolvedNodeId,
    });
  }, []);

  const handleRadialAction = useCallback(
    (action: RadialActionId, nodeId?: string) => {
      const targetNode = nodesRef.current.find((n) => n.id === nodeId) as
        | KDCINode
        | undefined;

      if (action === 'reset') {
        reset();
        setRadialState((prev) => ({ ...prev, visible: false }));
        return;
      }
      if (action === 'workspace' && targetNode && !targetNode.isDeclaredGap) {
        animateTo(targetNode.x, targetNode.y, 2.5);
        setTimeout(() => onNavigate(targetNode.route), 420);
        setRadialState((prev) => ({ ...prev, visible: false }));
        return;
      }
      if ((action === 'agents' || action === 'analytics') && onOpenCommandBar) {
        onOpenCommandBar();
        setRadialState((prev) => ({ ...prev, visible: false }));
        return;
      }
      if (action === 'connections') {
        if (!targetNode) {
          setRadialState((prev) => ({ ...prev, visible: false, nodeId: undefined }));
          return;
        }
        setPickingSourceNodeId(targetNode.id);
        setSelectedId(targetNode.id);
        setRadialState((prev) => ({ ...prev, visible: false }));
        return;
      }
    },
    [nodesRef, reset, animateTo, onNavigate, onOpenCommandBar]
  );

  // --- Relationship Graph edge forging ---
  const nodeAtWorldPoint = useCallback(
    (worldX: number, worldY: number): KDCINode | undefined => {
      let best: KDCINode | undefined;
      let bestDist = Infinity;
      for (const n of nodesRef.current) {
        const d = Math.hypot(n.x - worldX, n.y - worldY);
        if (d < n.radius && d < bestDist) {
          bestDist = d;
          best = n as KDCINode;
        }
      }
      return best;
    },
    [nodesRef]
  );

  const pickTarget = useCallback(
    (sourceId: string, targetNode: KDCINode) => {
      if (sourceId === targetNode.id) return;
      const existing = edgeLinks.find(
        (l) =>
          (l.source === sourceId && l.target === targetNode.id) ||
          (l.source === targetNode.id && l.target === sourceId)
      );
      if (existing) {
        setPickingSourceNodeId(null);
        return;
      }
      const newLink: EcosystemLink = {
        source: sourceId,
        target: targetNode.id,
        type: 'data',
      };
      setEdgeLinks((prev) => [...prev, newLink]);
      setPickingSourceNodeId(null);
      // Persist to localStorage (seed from key, merge for overrides).
      try {
        const seed = window.localStorage.getItem(
          'kdci-ecosystem-links-seed'
        );
        const stored = seed ? (JSON.parse(seed) as EcosystemLink[]) : [];
        const merged = [
          ...stored.filter(
            (l) =>
              l.source !== sourceId || l.target !== targetNode.id ||
              l.type !== 'data'
          ),
          newLink,
        ];
        window.localStorage.setItem(
          'kdci-ecosystem-links-seed',
          JSON.stringify(merged)
        );
      } catch {
        // non-fatal
      }
    },
    [edgeLinks]
  );

  const onNodeGrabEnd = useCallback(
    (nodeId: string) => {
      releaseNode();
      if (pickingSourceNodeId) {
        const picked = nodeAtWorldPoint(
          cameraRef.current.x / cameraRef.current.zoom,
          cameraRef.current.y / cameraRef.current.zoom
        );
        if (picked && picked.id !== pickingSourceNodeId) {
          pickTarget(pickingSourceNodeId, picked as KDCINode);
        }
        setPickingSourceNodeId(null);
      }
    },
    [pickingSourceNodeId, releaseNode, cameraRef, nodeAtWorldPoint, pickTarget]
  );

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
          {edgeLinks.map((link, idx) => {
            const src = nodesRef.current.find((n) => n.id === link.source);
            const tgt = nodesRef.current.find((n) => n.id === link.target);
            if (!src || !tgt) return null;
            return (
              <g key={`${link.source}-${link.target}-${idx}`}>
                <line
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
                <circle
                  ref={(el) => {
                    if (el) pulseDomRefs.current.set(idx, el);
                    else pulseDomRefs.current.delete(idx);
                  }}
                  cx={src.x}
                  cy={src.y}
                  r={3.5}
                  className={`gold-pulse-dot pulse-${link.type}`}
                />
              </g>
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

      <RadialMenu
        state={radialState}
        nodeTitle={
          radialState.nodeId
            ? (nodesRef.current.find((n) => n.id === radialState.nodeId) as
                | KDCINode
                | undefined)?.title
            : undefined
        }
        isDeclaredGap={
          radialState.nodeId
            ? (nodesRef.current.find((n) => n.id === radialState.nodeId) as
                | KDCINode
                | undefined)?.isDeclaredGap
            : undefined
        }
        onAction={handleRadialAction}
        onClose={() => setRadialState((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
