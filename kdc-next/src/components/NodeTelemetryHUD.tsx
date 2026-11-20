import React from "react";
import { VentureMetadata } from "../data/nodeMetadata";

interface Props {
  metadata: VentureMetadata | undefined;
  inboundLinks: number;
  outboundLinks: number;
  onFocus: () => void;
  onOpenWorkspace: () => void;
}

export function NodeTelemetryHUD({
  metadata,
  inboundLinks,
  outboundLinks,
  onFocus,
  onOpenWorkspace,
}: Props) {
  if (!metadata) return null;

  return (
    <aside className="node-telemetry-hud" aria-label="Venture Telemetry HUD">
      <div className="telemetry-hud-top">
        <div>
          <span className="telemetry-category">
            {metadata.category.toUpperCase()} // {metadata.sectorTag}
          </span>
          <h2 className="telemetry-title">{metadata.title}</h2>
        </div>
        <span
          className={`telemetry-health-pill ${
            metadata.isDeclaredGap ? "is-gap" : ""
          }`}
        >
          {metadata.isDeclaredGap ? "404 GAP" : `${metadata.health}% HEALTH`}
        </span>
      </div>

      <p className="telemetry-summary">{metadata.summary}</p>

      <div className="telemetry-grid">
        <div className="telemetry-cell">
          <label>PROJECTS</label>
          <strong>{metadata.projects}</strong>
        </div>
        <div className="telemetry-cell">
          <label>AGENTS</label>
          <strong>{metadata.agents}</strong>
        </div>
        <div className="telemetry-cell">
          <label>REVENUE STREAMS</label>
          <strong>{metadata.revenueStreamCount}</strong>
        </div>
        <div className="telemetry-cell">
          <label>GRAPH EDGES</label>
          <strong>
            {inboundLinks} IN / {outboundLinks} OUT
          </strong>
        </div>
      </div>

      <div className="telemetry-meta-strip">
        <span>
          <strong>{metadata.primaryMetricLabel}:</strong>{" "}
          {metadata.primaryMetricValue}
        </span>
        <span className="telemetry-agent">⚡ {metadata.leadAgent}</span>
      </div>

      <div className="telemetry-actions">
        <button className="telemetry-btn-secondary" onClick={onFocus}>
          ◎ FOCUS NODE
        </button>
        <button
          disabled={Boolean(metadata.isDeclaredGap)}
          className="telemetry-btn-primary"
          onClick={onOpenWorkspace}
        >
          {metadata.isDeclaredGap ? "STANDBY (404)" : "OPEN WORKSPACE →"}
        </button>
      </div>
    </aside>
  );
}
