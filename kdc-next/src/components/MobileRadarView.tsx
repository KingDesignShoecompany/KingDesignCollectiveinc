import React, { useRef, useEffect, useMemo } from "react";
import { KDCINode, EcosystemLink } from "./KDCICanvas";
import { getVentureMetadata } from "../data/nodeMetadata";
import { recordSpatialTransition, loadAnalyticsStore } from "../lib/commandAnalytics";
import { triggerTactilePulse } from "../lib/nativeBridge";

interface Props {
  nodes: readonly KDCINode[];
  links: readonly EcosystemLink[];
  selectedId: string;
  onSelectNode: (nodeId: string) => void;
  onOpenWorkspace: (nodeId: string) => void;
  onOpenCommandBar: () => void;
  onLongPressNode: (x: number, y: number, nodeId: string) => void;
}

export interface RadarPlacement {
  orbitRadius: number;
  signalStrength: "high" | "medium" | "low" | "anomaly";
  edgeDegree: number;
  opens: number;
}

export function calculateRadarPosition(
  node: KDCINode,
  links: readonly EcosystemLink[],
  workspaceOpens: Record<string, number>
): RadarPlacement {
  const edgeDegree = links.filter(
    (l) => l.source === node.id || l.target === node.id
  ).length;
  const opens = workspaceOpens[node.id] ?? 0;

  if (node.isDeclaredGap) {
    return { orbitRadius: 142, signalStrength: "anomaly", edgeDegree, opens };
  }

  const gravityScore = edgeDegree * 2 + opens;

  if (gravityScore >= 6) {
    return { orbitRadius: 76, signalStrength: "high", edgeDegree, opens };
  }
  if (gravityScore >= 2) {
    return { orbitRadius: 110, signalStrength: "medium", edgeDegree, opens };
  }
  return { orbitRadius: 136, signalStrength: "low", edgeDegree, opens };
}

export function MobileRadarView({
  nodes,
  links,
  selectedId,
  onSelectNode,
  onOpenWorkspace,
  onOpenCommandBar,
  onLongPressNode,
}: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const selectedNode =
    nodes.find((n) => n.id === selectedId) ?? nodes[0] ?? null;
  const selectedMeta = selectedNode
    ? getVentureMetadata(selectedNode.id)
    : undefined;

  // Step 7 telemetry: read workspaceOpens for radar gravity placement
  const workspaceOpens = useMemo(() => loadAnalyticsStore().workspaceOpens, [
    selectedId,
  ]);

  // 3-finger tap opens Command Palette on mobile radar
  useEffect(() => {
    const el = scopeRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        onOpenCommandBar();
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => el.removeEventListener("touchstart", onTouchStart);
  }, [onOpenCommandBar]);

  const coreNode = nodes.find((n) => n.id === "kdci-core");
  const orbitingNodes = nodes.filter((n) => n.id !== "kdci-core");

  const handleRadarTap = (targetId: string) => {
    if (targetId !== selectedId) {
      recordSpatialTransition(selectedId, targetId, "canvas");
    }
    onSelectNode(targetId);
    triggerTactilePulse("light");
  };

  const inboundCount = selectedNode
    ? links.filter((l) => l.target === selectedNode.id).length
    : 0;
  const outboundCount = selectedNode
    ? links.filter((l) => l.source === selectedNode.id).length
    : 0;

  return (
    <div ref={scopeRef} className="kdci-mobile-radar">
      {/* Safe-Area Top HUD */}
      <header className="radar-hud-top">
        <div>
          <span className="radar-hud-tag">KDCI OS // SPATIAL RADAR</span>
          <h1 className="radar-hud-title">ECOSYSTEM TELEMETRY</h1>
        </div>
        <button className="hud-cmd-btn" onClick={onOpenCommandBar}>
          ⌘K
        </button>
      </header>

      {/* Concentric Radar Scope */}
      <div className="radar-scope-stage">
        <div className="radar-scope">
          <div className="radar-ring radar-ring-outer" />
          <div className="radar-ring radar-ring-mid" />
          <div className="radar-ring radar-ring-inner" />
          <div className="radar-crosshair-x" />
          <div className="radar-crosshair-y" />

          {/* Central KDCI Core Reactor */}
          <button
            data-node-id="kdci-core"
            className={`radar-core-reactor ${
              selectedNode?.id === "kdci-core" ? "is-selected" : ""
            }`}
            onClick={() => coreNode && handleRadarTap(coreNode.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (coreNode) onLongPressNode(e.clientX, e.clientY, coreNode.id);
            }}
          >
            <span>KDCI</span>
            <small>CORE</small>
          </button>

          {/* Telemetry-Positioned Orbiting Venture Blips */}
          {orbitingNodes.map((node, index) => {
            const angle =
              (index / Math.max(1, orbitingNodes.length)) * Math.PI * 2 -
              Math.PI / 2;
            const placement = calculateRadarPosition(
              node,
              links,
              workspaceOpens
            );
            const left = `calc(50% + ${
              Math.cos(angle) * placement.orbitRadius
            }px)`;
            const top = `calc(50% + ${
              Math.sin(angle) * placement.orbitRadius
            }px)`;
            const isSelected = selectedNode?.id === node.id;

            return (
              <button
                key={node.id}
                data-node-id={node.id}
                className={`radar-blip signal-${placement.signalStrength} status-${node.status} ${
                  isSelected ? "is-selected" : ""
                }`}
                style={{ left, top }}
                onClick={() => handleRadarTap(node.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onLongPressNode(e.clientX, e.clientY, node.id);
                }}
              >
                <span className="radar-blip-dot" />
                <span className="radar-blip-label">{node.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Telemetry Inspector */}
      <section
        className="radar-bottom-sheet"
        aria-label="Mobile Venture Telemetry Sheet"
      >
        <div className="radar-sheet-grabber" />
        {selectedNode && (
          <div className="radar-sheet-body">
            <div className="radar-sheet-header">
              <div>
                <span className="radar-sheet-sector">
                  {(selectedMeta?.category ?? selectedNode.sectorTag).toUpperCase()}{" "}
                  // {selectedNode.sectorTag}
                </span>
                <h2 className="radar-sheet-title">{selectedNode.title}</h2>
              </div>
              <span
                className={`radar-sheet-health ${
                  selectedNode.isDeclaredGap ? "is-gap" : ""
                }`}
              >
                {selectedNode.isDeclaredGap
                  ? "404 GAP"
                  : `${selectedNode.health}%`}
              </span>
            </div>

            {selectedMeta?.summary && (
              <p className="radar-sheet-summary">{selectedMeta.summary}</p>
            )}

            <div className="radar-sheet-metrics">
              <div className="radar-metric-cell">
                <label>PROJECTS</label>
                <strong>{selectedNode.projects}</strong>
              </div>
              <div className="radar-metric-cell">
                <label>AGENTS</label>
                <strong>{selectedNode.agents}</strong>
              </div>
              <div className="radar-metric-cell">
                <label>EDGES</label>
                <strong>
                  {inboundCount} IN / {outboundCount} OUT
                </strong>
              </div>
            </div>

            <button
              className="radar-open-workspace-btn"
              onClick={() => onOpenWorkspace(selectedNode.id)}
            >
              OPEN WORKSPACE PANEL →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
