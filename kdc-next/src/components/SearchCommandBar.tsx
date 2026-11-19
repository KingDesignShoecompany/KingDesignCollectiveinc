import React, { useState, useEffect, useMemo } from 'react';

import { KDCINode } from './KDCICanvas';

export interface CommandEntry {
  id: string;
  label: string;
  subtitle: string;
  badge?: string;
  kind: 'node' | 'action';
  nodeId?: string;
  route?: string;
  actionId?: 'fit_all' | 'reset_view';
}

interface Props {
  open: boolean;
  nodes: readonly KDCINode[];
  onClose: () => void;
  onFocusNode: (node: KDCINode) => void;
  onLaunchRoute: (route: string) => void;
  onFitAll: (nodes: readonly { x: number; y: number; radius: number }[]) => void;
  onResetView: () => void;
}

const HISTORY_KEY = 'kdci-command-history';
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
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
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(loadHistory);

  // Build unified command list (System Actions + Subsidiary Nodes)
  const allCommands = useMemo<CommandEntry[]>(() => {
    const systemActions: CommandEntry[] = [
      {
        id: 'sys-fit-all',
        label: 'Frame Full Ecosystem (Fit All)',
        subtitle: 'SYSTEM // CAMERA FRAMING',
        badge: 'VIEW',
        kind: 'action',
        actionId: 'fit_all',
      },
      {
        id: 'sys-reset-view',
        label: 'Reset Camera Origin (100%)',
        subtitle: 'SYSTEM // CAMERA ORIGIN',
        badge: 'RESET',
        kind: 'action',
        actionId: 'reset_view',
      },
    ];

    const nodeCommands: CommandEntry[] = nodes.map((n) => ({
      id: `node-${n.id}`,
      label: n.title,
      subtitle: `[${n.sectorTag}] · ${n.projects} Projects · ${n.agents} Agents`,
      badge: n.isDeclaredGap ? '404 GAP' : `${n.health}%`,
      kind: 'node',
      nodeId: n.id,
      route: n.route,
    }));

    return [...nodeCommands, ...systemActions];
  }, [nodes]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Surface recent commands first when query is empty
      const recentSet = new Set(recentIds);
      const recents = recentIds
        .map((id) => allCommands.find((c) => c.id === id))
        .filter((c): c is CommandEntry => Boolean(c));
      const rest = allCommands.filter((c) => !recentSet.has(c.id));
      return [...recents, ...rest];
    }

    return allCommands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        (cmd.route && cmd.route.toLowerCase().includes(q))
    );
  }, [allCommands, query, recentIds]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const recordUsage = (cmdId: string) => {
    const next = [cmdId, ...recentIds.filter((id) => id !== cmdId)].slice(
      0,
      MAX_HISTORY
    );
    setRecentIds(next);
    saveHistory(next);
  };

  const executeEntry = (entry: CommandEntry, launchWorkspace = false) => {
    recordUsage(entry.id);

    if (entry.kind === 'action') {
      if (entry.actionId === 'fit_all') onFitAll(nodes as readonly { x: number; y: number; radius: number }[]);
      if (entry.actionId === 'reset_view') onResetView();
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
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        executeEntry(filteredCommands[selectedIndex], e.shiftKey);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filteredCommands, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div className="command-input-row">
          <span className="command-prefix">KDCI //</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Fly to subsidiary, run view command, or filter agents..."
            autoFocus
          />
          <button className="command-esc" onClick={onClose}>
            ESC
          </button>
        </div>

        <div className="command-hint-bar">
          <span>ENTER: Fly to Node</span>
          <span>SHIFT+ENTER: Enter Workspace</span>
          <span>3-FINGER TAP / ⌘K</span>
        </div>

        <div className="command-results">
          {filteredCommands.map((entry, idx) => {
            const isRecent = !query.trim() && recentIds.includes(entry.id);
            const node = entry.nodeId
              ? (nodes.find((n) => n.id === entry.nodeId) as KDCINode | undefined)
              : undefined;

            return (
              <div
                key={entry.id}
                className={`command-item ${idx === selectedIndex ? 'is-active' : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <button
                  className="command-item-main"
                  onClick={() => executeEntry(entry, false)}
                >
                  <div>
                    <div className="command-title-row">
                      <strong>{entry.label}</strong>
                      {isRecent && (
                        <span className="command-recent-tag">RECENT</span>
                      )}
                    </div>
                    <span className="command-sub">{entry.subtitle}</span>
                  </div>

                  {entry.badge && (
                    <span
                      className={`command-badge ${
                        node?.isDeclaredGap ? 'badge-gap' : ''
                      }`}
                    >
                      {entry.badge}
                    </span>
                  )}
                </button>

                {entry.kind === 'node' && !node?.isDeclaredGap && (
                  <button
                    className="command-open-btn"
                    onClick={() => executeEntry(entry, true)}
                  >
                    OPEN →
                  </button>
                )}
              </div>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="command-empty">
              No KDCI ventures or commands matching "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
