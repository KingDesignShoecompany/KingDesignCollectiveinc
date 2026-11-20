import { KDCINode } from "../components/KDCICanvas";

export type CommandKind = "node" | "system" | "workspace";

export interface CommandDefinition {
  id: string;
  label: string;
  subtitle: string;
  badge?: string;
  kind: CommandKind;
  nodeId?: string;
  route?: string;
  actionId?: "fit_all" | "reset_view";
  isDeclaredGap?: boolean;
  keywords: string[];
}

export interface RankedCommand extends CommandDefinition {
  score: number;
  isPinned: boolean;
  isRecent: boolean;
}

const HISTORY_KEY = "kdci-command-history";
const PINNED_KEY = "kdci-pinned-commands";
const MAX_HISTORY = 6;

const DEFAULT_PINNED_IDS = [
  "node-travel-index",
  "node-shoe-brand",
  "node-game-design",
  "node-innovation-hub",
  "sys-fit-all",
];

export function loadCommandHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordCommandHistory(commandId: string): string[] {
  const prev = loadCommandHistory();
  const next = [commandId, ...prev.filter((id) => id !== commandId)].slice(
    0,
    MAX_HISTORY
  );
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}

export function loadPinnedCommands(): string[] {
  if (typeof window === "undefined") return DEFAULT_PINNED_IDS;
  try {
    const raw = window.localStorage.getItem(PINNED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_PINNED_IDS;
  } catch {
    return DEFAULT_PINNED_IDS;
  }
}

export function togglePinnedCommand(commandId: string): string[] {
  const prev = loadPinnedCommands();
  const next = prev.includes(commandId)
    ? prev.filter((id) => id !== commandId)
    : [commandId, ...prev];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PINNED_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors
    }
  }
  return next;
}

export function buildSystemCommands(): CommandDefinition[] {
  return [
    {
      id: "sys-fit-all",
      label: "Frame Full Ecosystem (Fit All)",
      subtitle: "SYSTEM // CAMERA FRAMING",
      badge: "VIEW",
      kind: "system",
      actionId: "fit_all",
      keywords: ["fit", "all", "frame", "ecosystem", "zoom", "overview"],
    },
    {
      id: "sys-reset-view",
      label: "Reset Camera Origin (100%)",
      subtitle: "SYSTEM // CAMERA ORIGIN",
      badge: "RESET",
      kind: "system",
      actionId: "reset_view",
      keywords: ["reset", "origin", "center", "recenter", "100"],
    },
  ];
}

export function buildNodeCommands(
  nodes: readonly KDCINode[]
): CommandDefinition[] {
  return nodes.map((n) => ({
    id: `node-${n.id}`,
    label: n.title,
    subtitle: `[${n.sectorTag}] · ${n.projects} Projects · ${n.agents} Agents`,
    badge: n.isDeclaredGap ? "404 GAP" : `${n.health}%`,
    kind: "node",
    nodeId: n.id,
    route: n.route,
    isDeclaredGap: n.isDeclaredGap,
    keywords: [
      n.id,
      n.title.toLowerCase(),
      n.sectorTag.toLowerCase(),
      n.route.toLowerCase(),
    ],
  }));
}

export function rankCommands(
  commands: readonly CommandDefinition[],
  query: string,
  pinnedIds: readonly string[],
  recentIds: readonly string[]
): RankedCommand[] {
  const q = query.trim().toLowerCase();
  const pinnedSet = new Set(pinnedIds);
  const recentSet = new Set(recentIds);

  const scored: RankedCommand[] = [];

  for (const cmd of commands) {
    const isPinned = pinnedSet.has(cmd.id);
    const isRecent = recentSet.has(cmd.id);
    const labelLower = cmd.label.toLowerCase();
    const routeLower = (cmd.route ?? "").toLowerCase();
    const subLower = cmd.subtitle.toLowerCase();

    if (q) {
      const matchesTitle = labelLower.includes(q);
      const matchesRoute = routeLower.includes(q);
      const matchesMeta =
        subLower.includes(q) || cmd.keywords.some((k) => k.includes(q));

      if (!matchesTitle && !matchesRoute && !matchesMeta) continue;

      let score = 0;
      if (labelLower.startsWith(q)) score += 18;
      else if (matchesTitle) score += 10;
      if (matchesRoute) score += 5;
      if (matchesMeta) score += 2;
      if (isRecent) score += 3;
      if (isPinned) score += 20;

      scored.push({ ...cmd, score, isPinned, isRecent });
    } else {
      // Empty query: sort by Pinned (+20) then Recent (+3)
      const score = (isPinned ? 20 : 0) + (isRecent ? 3 : 0);
      scored.push({ ...cmd, score, isPinned, isRecent });
    }
  }

  return scored.sort((a, b) => b.score - a.score);
}
