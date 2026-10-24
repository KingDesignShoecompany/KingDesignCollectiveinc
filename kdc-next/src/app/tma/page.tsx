'use client'

import { useEffect, useState } from 'react'
import TMADashboard from '../../components/tma/TMADashboard'
import TMATaskForm from '../../components/tma/TMATaskForm'
import { getWebApp } from '../../lib/tma-client'

interface InitResponse {
  user?: {
    id: number
    first_name: string
    is_premium?: boolean
  }
  chat?: { id: number; type: string; title: string }
  start_param?: string
  company?: Record<string, unknown>
}

export default function TmaApp() {
  const [ready, setReady] = useState(false)
  const [initData, setInitData] = useState<InitResponse | null>(null)

  useEffect(() => {
    const wa = getWebApp()

    if (!wa) {
      // Fallback for web browsing (not in Telegram)
      setReady(true)
      return
    }

    wa.ready()
    wa.expand()

    if (wa.initData) {
      fetch('/api/tma/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData: wa.initData }),
      })
        .then(r => r.json())
        .then(d => {
          setInitData(d)
          setReady(true)
        })
        .catch(() => setReady(true))
    } else {
      setReady(true)
    }

    // Handle viewport changes for full expansion
    const handleViewport = () => wa.expand()
    wa.onEvent('viewportChanged', handleViewport)

    return () => {
      wa.offEvent('viewportChanged', handleViewport)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>KingDesign OS — Initializing…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      {initData?.user && (
        <div className="px-4 py-2 text-sm opacity-60">
          Running as: {initData.user.first_name}
          {initData.user.is_premium && ' 🌟 Premium'}
        </div>
      )}
      <TMADashboard />
      <TMATaskForm />
    </div>
  )
}
