import React, { useState, useEffect } from "react";
import { VentureMetadata } from "../data/nodeMetadata";
import { EcosystemLink } from "./KDCICanvas";

export type WorkspaceTabId = "overview" | "projects" | "agents" | "graph";

interface Props {
  open: boolean;
  metadata: VentureMetadata | undefined;
  links: readonly EcosystemLink[];
  nodeTitles: Record<string, string>;
  onClose: () => void;
  onLaunchFullRoute: (route: string) => void;
  onFocusLinkedNode: (nodeId: string) => void;
  onWorkspaceTabChange?: (tabId: WorkspaceTabId) => void;
  onRemoveLink?: (source: string, target: string) => void;
}

export function WorkspaceDrawer({
  open,
  metadata,
  links,
  nodeTitles,
  onClose,
  onLaunchFullRoute,
  onFocusLinkedNode,
  onWorkspaceTabChange,
  onRemoveLink,
}: Props) {
  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("overview");

  useEffect(() => {
    if (open) setActiveTab("overview");
  }, [open, metadata?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !metadata) return null;

  const inbound = links.filter((l) => l.target === metadata.id);
  const outbound = links.filter((l) => l.source === metadata.id);

  // Deterministic sector project & agent synthesis from VentureMetadata
  const projectList = Array.from({ length: metadata.projects }, (_, i) => ({
    id: `${metadata.id}-proj-${i + 1}`,
    name: `${metadata.title} Initiative 0${i + 1}`,
    phase: i === 0 ? "PRODUCTION" : i % 2 === 0 ? "ACTIVE SPRINT" : "TELEMETRY SYNC",
  }));

  const agentList = [
    {
      id: metadata.leadAgent,
      role: "LEAD SECTOR ORCHESTRATOR",
      state: metadata.isDeclaredGap ? "STANDBY" : "ONLINE",
    },
    ...Array.from({ length: Math.max(0, metadata.agents - 1) }, (_, i) => ({
      id: `${metadata.id}-worker-0${i + 1}`,
      role: "AUTONOMOUS TELEMETRY WORKER",
      state: "ONLINE",
    })),
  ];

  return (
    <aside
      className="workspace-drawer"
      aria-label={`${metadata.title} Workspace Panel`}
    >
      {/* Header */}
      <header className="workspace-header">
        <div>
          <span className="workspace-eyebrow">
            {metadata.category.toUpperCase()} // WORKSPACE RUNTIME
          </span>
          <h2 className="workspace-title">{metadata.title}</h2>
        </div>
        <button
          className="workspace-close-btn"
          onClick={onClose}
          title="Close Workspace (Esc)"
        >
          ✕
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="workspace-tabs" role="tablist">
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "projects", label: `Projects (${metadata.projects})` },
            { id: "agents", label: `Agents (${metadata.agents})` },
            { id: "graph", label: `Edges (${inbound.length + outbound.length})` },
          ] as { id: WorkspaceTabId; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`workspace-tab-btn ${
              activeTab === tab.id ? "is-active" : ""
            }`}
            onClick={() => {
              setActiveTab(tab.id);
              onWorkspaceTabChange?.(tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Body */}
      <div className="workspace-body">
        {activeTab === "overview" && (
          <div className="workspace-section">
            <p className="workspace-summary">{metadata.summary}</p>

            <div className="workspace-kpi-grid">
              <div className="workspace-kpi-card">
                <label>SYSTEM HEALTH</label>
                <strong>
                  {metadata.isDeclaredGap ? "404 GAP" : `${metadata.health}%`}
                </strong>
              </div>
              <div className="workspace-kpi-card">
                <label>{metadata.primaryMetricLabel}</label>
                <strong>{metadata.primaryMetricValue}</strong>
              </div>
              <div className="workspace-kpi-card">
                <label>REVENUE STREAMS</label>
                <strong>{metadata.revenueStreamCount}</strong>
              </div>
              <div className="workspace-kpi-card">
                <label>CANONICAL ROUTE</label>
                <strong className="workspace-route-code">{metadata.route}</strong>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="workspace-list">
            {projectList.map((proj) => (
              <div key={proj.id} className="workspace-list-card">
                <div>
                  <strong>{proj.name}</strong>
                  <span className="workspace-list-sub">{proj.id}</span>
                </div>
                <span className="workspace-pill">{proj.phase}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "agents" && (
          <div className="workspace-list">
            {agentList.map((agent) => (
              <div key={agent.id} className="workspace-list-card">
                <div>
                  <strong className="workspace-mono">⚡ {agent.id}</strong>
                  <span className="workspace-list-sub">{agent.role}</span>
                </div>
                <span
                  className={`workspace-pill ${
                    agent.state === "STANDBY" ? "is-warn" : ""
                  }`}
                >
                  {agent.state}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "graph" && (
          <div className="workspace-section">
            <h3 className="workspace-subheading">
              OUTBOUND CONNECTIONS ({outbound.length})
            </h3>
            <div className="workspace-list">
              {outbound.map((edge, idx) => (
                <div
                  key={`out-${edge.target}-${idx}`}
                  className="workspace-list-card"
                >
                  <button
                    className="workspace-link-jump"
                    onClick={() => onFocusLinkedNode(edge.target)}
                  >
                    <strong>→ {nodeTitles[edge.target] ?? edge.target}</strong>
                    <span className="workspace-list-sub">
                      STREAM: {edge.type.toUpperCase()}
                    </span>
                  </button>
                  {onRemoveLink && (
                    <button
                      className="workspace-unlink-btn"
                      onClick={() => onRemoveLink(edge.source, edge.target)}
                      title="Sever connection"
                    >
                      UNLINK
                    </button>
                  )}
                </div>
              ))}
              {outbound.length === 0 && (
                <p className="workspace-empty">No outbound edges forged.</p>
              )}
            </div>

            <h3 className="workspace-subheading" style={{ marginTop: "14px" }}>
              INBOUND CONNECTIONS ({inbound.length})
            </h3>
            <div className="workspace-list">
              {inbound.map((edge, idx) => (
                <div
                  key={`in-${edge.source}-${idx}`}
                  className="workspace-list-card"
                >
                  <button
                    className="workspace-link-jump"
                    onClick={() => onFocusLinkedNode(edge.source)}
                  >
                    <strong>← {nodeTitles[edge.source] ?? edge.source}</strong>
                    <span className="workspace-list-sub">
                      STREAM: {edge.type.toUpperCase()}
                    </span>
                  </button>
                </div>
              ))}
              {inbound.length === 0 && (
                <p className="workspace-empty">No inbound edges forged.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Full-Portal Launch */}
      <footer className="workspace-footer">
        <button
          disabled={Boolean(metadata.isDeclaredGap)}
          className="workspace-launch-portal-btn"
          onClick={() =>
            !metadata.isDeclaredGap && onLaunchFullRoute(metadata.route)
          }
        >
          {metadata.isDeclaredGap
            ? "PORTAL STANDBY (DECLARED 404 GAP)"
            : `LAUNCH FULL PORTAL (${metadata.route}) ↗`}
        </button>
      </footer>
    </aside>
  );
}
