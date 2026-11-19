import React from "react";

export type RadialActionId =
  | "workspace"
  | "analytics"
  | "agents"
  | "reports"
  | "connections"
  | "reset";

export interface RadialMenuState {
  visible: boolean;
  x: number;
  y: number;
  nodeId?: string;
}

interface Props {
  state: RadialMenuState;
  nodeTitle?: string;
  isDeclaredGap?: boolean;
  onAction: (action: RadialActionId, nodeId?: string) => void;
  onClose: () => void;
}

const RADIAL_ITEMS: { id: RadialActionId; label: string; icon: string }[] = [
  { id: "workspace", label: "Workspace", icon: "⬡" },
  { id: "analytics", label: "Analytics", icon: "◈" },
  { id: "agents", label: "Agents", icon: "⚡" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "connections", label: "Link Node", icon: "☍" },
  { id: "reset", label: "Recenter", icon: "⌖" },
];

export function RadialMenu({
  state,
  nodeTitle,
  isDeclaredGap,
  onAction,
  onClose,
}: Props) {
  if (!state.visible) return null;

  const radius = 92;
  const edgeMargin = 132;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const cx = Math.min(vw - edgeMargin, Math.max(edgeMargin, state.x));
  const cy = Math.min(vh - edgeMargin, Math.max(edgeMargin, state.y));

  return (
    <div
      className="radial-backdrop"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="radial-anchor" style={{ left: cx, top: cy }}>
        <div className="radial-center-hub">
          <span>{nodeTitle ?? "KDCI OS"}</span>
        </div>

        {RADIAL_ITEMS.map((item, idx) => {
          const angle = (idx / RADIAL_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          const disabled = item.id === "workspace" && isDeclaredGap;

          return (
            <button
              key={item.id}
              disabled={disabled}
              className={`radial-wedge-btn ${disabled ? "is-disabled" : ""}`}
              style={{
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAction(item.id, state.nodeId);
                onClose();
              }}
            >
              <span className="radial-icon">{item.icon}</span>
              <span className="radial-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
