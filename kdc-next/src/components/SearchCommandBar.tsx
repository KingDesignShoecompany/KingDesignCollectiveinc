import React, { useState, useEffect, useMemo } from "react";
import { KDCINode } from "./KDCICanvas";
import {
  buildNodeCommands,
  buildSystemCommands,
  loadCommandHistory,
  recordCommandHistory,
  loadPinnedCommands,
  togglePinnedCommand,
  rankCommands,
  RankedCommand,
} from "../lib/commandRegistry";

interface Props {
  open: boolean;
  nodes: readonly KDCINode[];
  onClose: () => void;
  onFocusNode: (node: KDCINode) => void;
  onLaunchRoute: (route: string) => void;
  onFitAll: (nodes: readonly { x: number; y: number; radius: number }[]) => void;
  onResetView: () => void;
}

export function SearchCommandBar({
  open,
  nodes,
  onClose,
  onFocusNode,
  onLaunchRoute,
  onFitAll,
  onResetView,
}: Props) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<string[]>(loadPinnedCommands);
  const [recentIds, setRecentIds] = useState<string[]>(loadCommandHistory);

  const registry = useMemo(
    () => [...buildNodeCommands(nodes), ...buildSystemCommands()],
    [nodes]
  );

  const ranked = useMemo(
    () => rankCommands(registry, query, pinnedIds, recentIds),
    [registry, query, pinnedIds, recentIds]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setPinnedIds(loadPinnedCommands());
      setRecentIds(loadCommandHistory());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeEntry = (entry: RankedCommand, launchWorkspace = false) => {
    setRecentIds(recordCommandHistory(entry.id));

    if (entry.kind === "system") {
      if (entry.actionId === "fit_all") onFitAll(nodes);
      if (entry.actionId === "reset_view") onResetView();
      onClose();
      return;
    }

    const targetNode = nodes.find((n) => n.id === entry.nodeId);
    if (!targetNode) return;

    onFocusNode(targetNode);
    if (launchWorkspace && !targetNode.isDeclaredGap) {
      setTimeout(() => onLaunchRoute(targetNode.route), 420);
    }
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          ranked.length ? (prev + 1) % ranked.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          ranked.length ? (prev - 1 + ranked.length) % ranked.length : 0
        );
      } else if (e.key === "Enter" && ranked[selectedIndex]) {
        e.preventDefault();
        executeEntry(ranked[selectedIndex], e.shiftKey);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, ranked, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-row">
          <span className="command-prefix">KDCI //</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Fly to venture, filter agents, or run system command..."
            autoFocus
          />
          <button className="command-esc" onClick={onClose}>
            ESC
          </button>
        </div>

        <div className="command-hint-bar">
          <span>ENTER: Fly to Node</span>
          <span>SHIFT+ENTER: Open Workspace</span>
          <span>★ PIN TO TOP</span>
        </div>

        <div className="command-results">
          {ranked.map((entry, idx) => (
            <div
              key={entry.id}
              className={`command-item ${idx === selectedIndex ? "is-active" : ""}`}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <button
                className="command-pin-btn"
                title={entry.isPinned ? "Unpin command" : "Pin command"}
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedIds(togglePinnedCommand(entry.id));
                }}
              >
                {entry.isPinned ? "★" : "☆"}
              </button>

              <button
                className="command-item-main"
                onClick={() => executeEntry(entry, false)}
              >
                <div>
                  <div className="command-title-row">
                    <strong>{entry.label}</strong>
                    {entry.isPinned && (
                      <span className="command-recent-tag">PINNED</span>
                    )}
                    {!entry.isPinned && entry.isRecent && (
                      <span className="command-recent-tag">RECENT</span>
                    )}
                  </div>
                  <span className="command-sub">{entry.subtitle}</span>
                </div>

                {entry.badge && (
                  <span
                    className={`command-badge ${entry.isDeclaredGap ? "badge-gap" : ""}`}
                  >
                    {entry.badge}
                  </span>
                )}
              </button>

              {entry.kind === "node" && !entry.isDeclaredGap && (
                <button
                  className="command-open-btn"
                  onClick={() => executeEntry(entry, true)}
                >
                  OPEN →
                </button>
              )}
            </div>
          ))}

          {ranked.length === 0 && (
            <div className="command-empty">
              No KDCI ventures or commands matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
