// KingDesign OS API client — fetches live data from the local OS API with graceful fallback.
// The OS API runs at http://localhost:8090 (kdos.py serve).
// During static export or when the API is unreachable, all functions fall back to
// the existing static data from ../data/dashboard.

const OS_API_BASE = process.env.NEXT_PUBLIC_OS_API || 'http://127.0.0.1:8090/api/v1';
const FETCH_TIMEOUT = 3000;

async function osFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    const res = await fetch(`${OS_API_BASE}${endpoint}`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null; // API unreachable — caller handles fallback
  }
}

export interface OSDashboardSummary {
  timestamp: string;
  organizations: { total: number; subsidiaries: number; active: number; pending: number };
  projects: { total: number; active: number; blocked: number };
  tasks: { todo: number; in_progress: number; review: number; done: number; blocked: number };
  agents: { total: number };
  pipeline: Array<{ priority: string; name: string; company_id: string; status: string }>;
}

export interface OSOrg {
  id: string;
  name: string;
  type: 'holding' | 'subsidiary' | 'division';
  status: string;
  sector_id: string | null;
}

export async function fetchDashboard(): Promise<OSDashboardSummary | null> {
  return osFetch<OSDashboardSummary>('/dashboard');
}

export async function fetchOrgs(): Promise<OSOrg[] | null> {
  return osFetch<OSOrg[]>('/orgs');
}

export async function fetchTasks(): Promise<OSTask[] | null> {
  return osFetch<OSTask[]>('/tasks');
}

export interface OSTask {
  id: string;
  title: string;
  description: string;
  assigned_agent_id: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function mapOrgStatusToLabel(status: string): string {
  switch (status) {
    case 'active': return 'Formed';
    case 'pending': return 'Pending';
    case 'incubating': return 'Forming';
    default: return status;
  }
}
