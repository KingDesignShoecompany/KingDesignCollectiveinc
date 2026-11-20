export type WorkspaceTabId = "overview" | "projects" | "agents" | "graph";

export interface SpatialTransition {
  fromNodeId: string | null;
  toNodeId: string;
  via: "canvas" | "command" | "radial" | "graph_edge";
  timestamp: number;
}

export interface CommandAnalyticsStore {
  workspaceOpens: Record<string, number>;
  portalLaunches: Record<string, number>;
  tabVisits: Record<string, Record<WorkspaceTabId, number>>;
  commandExecutions: Record<string, number>;
  transitions: SpatialTransition[];
  lastUpdated: number;
}

export interface AnalyticsSummary {
  totalOpens: number;
  totalCommands: number;
  totalTransitions: number;
  topVentures: { nodeId: string; opens: number; launches: number }[];
  topCommands: { commandId: string; count: number }[];
  recentTransitions: SpatialTransition[];
}

const ANALYTICS_KEY = "kdci-command-analytics";
const MAX_TRANSITIONS = 40;

function emptyStore(): CommandAnalyticsStore {
  return {
    workspaceOpens: {},
    portalLaunches: {},
    tabVisits: {},
    commandExecutions: {},
    transitions: [],
    lastUpdated: Date.now(),
  };
}

export function loadAnalyticsStore(): CommandAnalyticsStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<CommandAnalyticsStore>;
    return {
      workspaceOpens: parsed.workspaceOpens ?? {},
      portalLaunches: parsed.portalLaunches ?? {},
      tabVisits: parsed.tabVisits ?? {},
      commandExecutions: parsed.commandExecutions ?? {},
      transitions: Array.isArray(parsed.transitions) ? parsed.transitions : [],
      lastUpdated: parsed.lastUpdated ?? Date.now(),
    };
  } catch {
    return emptyStore();
  }
}

function saveAnalyticsStore(store: CommandAnalyticsStore): void {
  if (typeof window === "undefined") return;
  try {
    store.lastUpdated = Date.now();
    window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordWorkspaceOpen(nodeId: string): void {
  const store = loadAnalyticsStore();
  store.workspaceOpens[nodeId] = (store.workspaceOpens[nodeId] ?? 0) + 1;
  saveAnalyticsStore(store);
}

export function recordWorkspaceTabVisit(
  nodeId: string,
  tabId: WorkspaceTabId
): void {
  const store = loadAnalyticsStore();
  if (!store.tabVisits[nodeId]) {
    store.tabVisits[nodeId] = {
      overview: 0,
      projects: 0,
      agents: 0,
      graph: 0,
    };
  }
  store.tabVisits[nodeId][tabId] = (store.tabVisits[nodeId][tabId] ?? 0) + 1;
  saveAnalyticsStore(store);
}

export function recordWorkspaceLaunch(nodeId: string): void {
  const store = loadAnalyticsStore();
  store.portalLaunches[nodeId] = (store.portalLaunches[nodeId] ?? 0) + 1;
  saveAnalyticsStore(store);
}

export function recordCommandExecution(commandId: string): void {
  const store = loadAnalyticsStore();
  store.commandExecutions[commandId] =
    (store.commandExecutions[commandId] ?? 0) + 1;
  saveAnalyticsStore(store);
}

export function recordSpatialTransition(
  fromNodeId: string | null,
  toNodeId: string,
  via: SpatialTransition["via"]
): void {
  if (!toNodeId || fromNodeId === toNodeId) return;
  const store = loadAnalyticsStore();
  store.transitions = [
    { fromNodeId, toNodeId, via, timestamp: Date.now() },
    ...store.transitions,
  ].slice(0, MAX_TRANSITIONS);
  saveAnalyticsStore(store);
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const store = loadAnalyticsStore();

  const topVentures = Object.entries(store.workspaceOpens)
    .map(([nodeId, opens]) => ({
      nodeId,
      opens,
      launches: store.portalLaunches[nodeId] ?? 0,
    }))
    .sort((a, b) => b.opens - a.opens);

  const topCommands = Object.entries(store.commandExecutions)
    .map(([commandId, count]) => ({ commandId, count }))
    .sort((a, b) => b.count - a.count);

  const totalOpens = topVentures.reduce((acc, v) => acc + v.opens, 0);
  const totalCommands = topCommands.reduce((acc, c) => acc + c.count, 0);

  return {
    totalOpens,
    totalCommands,
    totalTransitions: store.transitions.length,
    topVentures,
    topCommands,
    recentTransitions: store.transitions.slice(0, 8),
  };
}

export function clearAnalyticsStore(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANALYTICS_KEY);
  } catch {
    // Ignore storage errors
  }
}
