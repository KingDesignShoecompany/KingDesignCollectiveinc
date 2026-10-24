'use client'

import { useEffect, useState } from 'react'
import { getWebApp } from '../../lib/tma-client'

interface TaskSummary {
  todo: number
  in_progress: number
  review: number
  done: number
  blocked: number
}

interface OrgSummary {
  total: number
  subsidiaries: number
  active: number
  pending: number
}

interface DashboardData {
  timestamp: string
  organizations: OrgSummary
  projects: { total: number; active: number; blocked: number }
  tasks: TaskSummary
  agents: { total: number }
  pipeline: Array<{ priority: string; name: string; company_id: string; status: string }>
}

interface TMADashboardProps {
  company?: DashboardData | null
  user?: { first_name: string }
}

export default function TMADashboard({ company, user }: TMADashboardProps) {
  const [data, setData] = useState<DashboardData | null>(company || null)
  const [loading, setLoading] = useState(!company)

  useEffect(() => {
    if (company) {
      setData(company)
      setLoading(false)
      return
    }

    fetch('/api/tma/init', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setData(d.company)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [company])

  useEffect(() => {
    const wa = getWebApp()
    if (wa?.themeParams) {
      const root = document.documentElement
      const tp = wa.themeParams
      if (tp.bg_color) root.style.setProperty('--tg-theme-bg-color', tp.bg_color)
      if (tp.text_color) root.style.setProperty('--tg-theme-text-color', tp.text_color)
      if (tp.button_color) root.style.setProperty('--tg-theme-button-color', tp.button_color)
    }
  }, [])

  if (loading) return <div className="p-4">Loading KingDesign OS…</div>
  if (!data) return <div className="p-4">Failed to load data.</div>

  const taskTotal = Object.values(data.tasks).reduce((a, b) => a + b, 0)
  const completedPct = taskTotal > 0
    ? Math.round((data.tasks.done / taskTotal) * 100)
    : 0

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">
        KingDesign OS
        {user && <span className="text-sm opacity-60 ml-2">— {user.first_name}</span>}
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Subsidiaries" value={data.organizations.subsidiaries} sub={`${data.organizations.active} active`} />
        <StatCard label="Agents" value={data.agents.total} sub="specialists" />
        <StatCard label="Tasks" value={taskTotal} sub={`${data.tasks.in_progress} in progress`} />
        <StatCard label="Done" value={`${completedPct}%`} sub={`${data.tasks.done} completed`} />
      </div>

      {data.tasks.blocked > 0 && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
          <span className="text-red-400 text-sm">⚠ {data.tasks.blocked} tasks blocked</span>
        </div>
      )}

      <div className="mt-4">
        <h2 className="text-sm font-semibold mb-2 opacity-80">Active Pipeline</h2>
        {data.pipeline.length === 0 && <p className="text-sm opacity-60">No active projects</p>}
        {data.pipeline.map((p, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-white/10">
            <span className="text-sm">{p.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              p.status === 'active' ? 'bg-green-500/20 text-green-400' :
              p.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-xs opacity-40">{sub}</div>
    </div>
  )
}
