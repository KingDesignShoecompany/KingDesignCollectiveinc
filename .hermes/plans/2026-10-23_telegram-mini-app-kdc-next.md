# Telegram Mini App for KingDesign OS — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Add a Telegram Mini App (TMA) as a new launch surface for KingDesign OS, integrated into the existing kdc-next Next.js app — users open the dashboard directly inside Telegram with native auth, push, and OS task creation.

**Architecture:** TMA is a route within kdc-next that initializes `window.Telegram.WebApp`, validates `initData` server-side, and renders the same KPI dashboard. Actions (e.g., create task) POST to the existing kdos.py API at :8090 via Next.js API route proxy.

**Tech Stack:** Next.js 15.5 (App Router), TypeScript 5.6, Tailwind, kdos.py API (:8090), Telegram WebApp JS (loaded at runtime via `telegram-web-app.js`), `better-auth` for existing auth.

---

## Files

| File | Action |
|------|--------|
| `src/app/tma/layout.tsx` | Create — TMA root layout, loads telegram-web-app.js via `<Script>` |
| `src/app/tma/page.tsx` | Create — main TMA page, calls `WebApp.ready()`, `expand()`, reads `initDataUnsafe` |
| `src/lib/tma-server.ts` | Create — server-side `validateInitData()` using HMAC-SHA256 with bot token from TELEGRAM_BOT_TOKEN env |
| `src/lib/tma-client.ts` | Create — client wrapper: `getWebApp()`, `MainButton`, `BackButton`, `HapticFeedback`, `CloudStorage` |
| `src/app/api/tma/init/route.ts` | Create — POST endpoint: validate initData, return user + company status (calls kdos API) |
| `src/app/api/tma/task/route.ts` | Create — POST endpoint: create task in kdos DB (proxy to :8090 API) |
| `src/components/tma/TMADashboard.tsx` | Create — KPI cards (subsidiary status, tasks, agents), styled with theme params |
| `src/components/tma/TMATaskForm.tsx` | Create — quick task form with MainButton integration |
| `src/app/page.tsx` | Modify — add "Open in Telegram" button on existing dashboard |
| `src/styles/globals.css` | Modify — add `env(safe-area-inset-*)` margins for fullscreen mode |
| `.env.local` | Modify — add `TELEGRAM_BOT_TOKEN` |
| `next.config.mjs` | Modify — add CSP headers to allow `https://telegram.org` |

---

## Tasks

### Task 1: Add Telegram bot token env var

**Objective:** Make the bot token available server-side for initData validation.

**Files:**
- Modify: `C:/Users/young/agents/.env.local`

**Code:**
```env
# Telegram Mini App
TELEGRAM_BOT_TOKEN=8166026735:AAF...  # @KingDesignBot token
NEXT_PUBLIC_TELEGRAM_APP_NAME=KingDesignOS
NEXT_PUBLIC_TELEGRAM_APP_SHORT_NAME=KDOS
```

**Step 1: Run** `cat .env.local | grep TELEGRAM`
Expected: shows the new lines

---

### Task 2: Create TMA server-side validation (`tma-server.ts`)

**Objective:** Validate Telegram `initData` using HMAC-SHA256 to authenticate TMA users.

**Files:**
- Create: `src/lib/tma-server.ts`

**Step 1: Write**
```typescript
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

export interface TMAUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface TMAInitData {
  query_id?: string
  user?: TMAUser
  chat?: { id: number; type: string; title: string }
  auth_date: number
  hash: string
  start_param?: string
}

export function validateInitData(initData: string): TMAInitData | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    const dataCheckString = [...params.entries()]
      .filter(([k]) => k !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    const isValid = computedHash === hash
    const authDate = parseInt(params.get('auth_date') || '0', 10)

    // Reject if auth_date is older than 24h
    if (Date.now() / 1000 - authDate > 86400) return null
    if (!isValid) return null

    const result: TMAInitData = {
      auth_date: authDate,
      hash,
    }

    const userStr = params.get('user')
    if (userStr) result.user = JSON.parse(userStr)

    const chatStr = params.get('chat')
    if (chatStr) result.chat = JSON.parse(chatStr)

    result.query_id = params.get('query_id') || undefined
    result.start_param = params.get('start_param') || undefined

    return result
  } catch {
    return null
  }
}
```

**Step 2: Run** `npx tsc --noEmit --next --pretty`
Expected: no errors

---

### Task 3: Create TMA client wrapper (`tma-client.ts`)

**Objective:** Provide typed client-side access to Telegram WebApp API with graceful fallback.

**Files:**
- Create: `src/lib/tma-client.ts`

**Step 1: Write**
```typescript
export type ColorScheme = 'light' | 'dark'

export interface ThemeParams {
  bg_color?: string
  text_color?: string
  hint_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

export interface WebApp {
  initData: string
  initDataUnsafe: {
    query_id?: string
    user?: { id: number; first_name: string; is_premium?: boolean }
    auth_date: number
    hash: string
    start_param?: string
  }
  version: string
  platform: string
  colorScheme: ColorScheme
  themeParams: ThemeParams
  isActive: boolean
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  safeAreaInset: { top: number; bottom: number; left: number; right: number }
  contentSafeAreaInset: { top: number; bottom: number; left: number; right: number }
  ready: () => void
  expand: () => void
  close: () => void
  isVersionAtLeast: (version: string) => boolean
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ type: string; text?: string; id?: string }> }, callback?: (buttonId: string | null) => void) => void
  enableClosingConfirmation: () => void
  disableClosingConfirmation: () => void
  MainButton: {
    setText: (text: string) => void
    show: () => void
    hide: () => void
    enable: () => void
    disable: () => void
    showProgress: (leaveActive?: boolean) => void
    hideProgress: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
    isVisible: boolean
    isEnabled: boolean
    text: string
    color: string
    textColor: string
  }
  BackButton: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (callback: () => void) => void
    offClick: (callback: () => void) => void
  }
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: object | null) => void) => void
    getItem: (key: string, callback: (error: object | null, value: string) => void) => void
    getKeys: (callback: (error: object | null, keys: string[]) => void) => void
  }
  onEvent: (eventType: 'viewportChanged' | 'themeChanged' | 'mainButtonClicked' | 'backButtonClicked' | 'settingsButtonClicked' | 'popupClosed', handler: () => void) => void
  offEvent: (eventType: string, handler: () => void) => void
}

declare global {
  interface Window {
    Telegram: { WebApp: WebApp; WebAppMainButton: unknown; WebAppBackButton: unknown }
  }
}

export function getWebApp(): WebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp
  }
  return null
}

export function getThemeParams(): ThemeParams {
  const wa = getWebApp()
  return wa?.themeParams || {}
}
```

**Step 2: Run** `npx tsc --noEmit --next --pretty`
Expected: no errors

---

### Task 4: Create TMA layout (`tma/layout.tsx`)

**Objective:** TMA page wrapper that loads telegram-web-app.js and waits for ready signal.

**Files:**
- Create: `src/app/tma/layout.tsx`

**Step 1: Write**
```tsx
'use client'

import Script from 'next/script'
import { useEffect } from 'react'
import './tma-styles.css'

export default function TMALayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkReady = setInterval(() => {
        const wa = (window as any).Telegram?.WebApp
        if (wa) {
          wa.ready()
          wa.expand()
          if (wa.setHeaderColor) wa.setHeaderColor('#0a0a0f')
          if (wa.setBackgroundColor) wa.setBackgroundColor('#0a0a0a')
          if (wa.enableVerticalSwipes) wa.enableVerticalSwipes()
          clearInterval(checkReady)
        }
      }, 50)
    }
  }, [])

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js?64"
        strategy="beforeInteractive"
      />
      <div className="tma-root">
        {children}
      </div>
    </>
  )
}
```

**Step 2: Create** `src/app/tma/tma-styles.css`:
```css
.tma-root {
  min-height: 100vh;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  background: var(--tg-theme-bg-color, #0a0a0a);
  color: var(--tg-theme-text-color, #ffffff);
}
```

**Step 3: Run** `npx tsc --noEmit --next --pretty`
Expected: no errors

---

### Task 5: Create TMA init API route

**Objective:** Server-side validation of initData on app load.

**Files:**
- Create: `src/app/api/tma/init/route.ts`

**Step 1: Write**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '@/lib/tma-server'

export async function POST(req: NextRequest) {
  const { initData } = await req.json()
  const user = validateInitData(initData)

  if (!user) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
  }

  // Fetch company status from kdos API
  const companyRes = await fetch('http://127.0.0.1:8090/api/v1/dashboard', {
    signal: AbortSignal.timeout(5000),
  }).catch(() => null)

  const companyData = companyRes?.ok
    ? await companyRes.json()
    : { error: 'OS API unavailable' }

  return NextResponse.json({
    user: user.user,
    chat: user.chat,
    start_param: user.start_param,
    company: companyData,
  })
}
```

**Step 2: Run** `npx tsc --noEmit --next --pretty`
Expected: no errors

---

### Task 6: Create TMA task proxy route

**Objective:** Create tasks in the OS from the Mini App.

**Files:**
- Create: `src/app/api/tma/task/route.ts`

**Step 1: Write**
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, description, assigned_agent_id, priority } = await req.json()

  const res = await fetch('http://127.0.0.1:8090/api/v1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, assigned_agent_id, priority }),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }

  const result = await res.json()
  return NextResponse.json({ success: true, task: result })
}
```

---

### Task 7: Create TMADashboard component

**Objective:** KPI dashboard showing subsidiary statuses, task pipeline, and agent activity.

**Files:**
- Create: `src/components/tma/TMADashboard.tsx`

**Step 1: Write**
```tsx
'use client'

import { useEffect, useState } from 'react'

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

export default function TMADashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tma/init', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        setData(d.company)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4">Loading KingDesign OS…</div>
  if (!data) return <div className="p-4">Failed to load data.</div>

  const taskTotal = Object.values(data.tasks).reduce((a, b) => a + b, 0)
  const completedPct = taskTotal > 0
    ? Math.round((data.tasks.done / taskTotal) * 100)
    : 0

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">KingDesign OS</h1>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Subsidiaries" value={data.organizations.subsidiaries} sub={`${data.organizations.active} active`} />
        <StatCard label="Agents" value={data.agents.total} sub="specialists" />
        <StatCard label="Tasks" value={taskTotal} sub={`${data.tasks.in_progress} in progress`} />
        <StatCard label="Done" value={`${completedPct}%`} sub={`${data.tasks.done} completed`} />
      </div>

      <div className="mt-4">
        <h2 className="text-sm font-semibold mb-2">Active Pipeline</h2>
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
```

---

### Task 8: Create TMA main page (`tma/page.tsx`)

**Objective:** Main TMA page that ties together init, dashboard, and task form with Telegram API.

**Files:**
- Create: `src/app/tma/page.tsx`

**Step 1: Write**
```tsx
'use client'

import { useEffect, useState } from 'react'
import TMADashboard from '@/components/tma/TMADashboard'
import TMATaskForm from '@/components/tma/TMATaskForm'
import { getWebApp } from '@/lib/tma-client'

export default function TMPApp() {
  const [userReady, setUserReady] = useState(false)
  const [hasInitData, setHasInitData] = useState(false)

  useEffect(() => {
    const wa = getWebApp()
    if (wa) {
      setHasInitData(!!wa.initData)
      // Read initData and send to server for validation
      if (wa.initData) {
        fetch('/api/tma/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: wa.initData }),
        }).then(r => {
          if (r.ok) setUserReady(true)
        })
      }
    } else {
      // Fallback for web browsing (not in Telegram)
      setUserReady(true)
    }

    const handleViewport = () => {
      const w = getWebApp()
      if (w) w.expand()
    }
    const wa = getWebApp()
    if (wa) wa.onEvent('viewportChanged', handleViewport)
  }, [])

  if (!userReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Initializing KingDesign OS…</div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <TMADashboard />
      <TMATaskForm />
    </div>
  )
}
```

---

### Task 9: Create TMATaskForm component

**Objective:** Quick task entry with Telegram MainButton + haptic feedback.

**Files:**
- Create: `src/components/tma/TMATaskForm.tsx`

**Step 1: Write**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { getWebApp } from '@/lib/tma-client'

export default function TMATaskForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const wa = getWebApp()
    if (wa?.MainButton) {
      wa.MainButton.setText('Create Task')
      wa.MainButton.show()
      wa.MainButton.enable()
      wa.MainButton.onClick(() => {
        if (title.trim()) handleSubmit()
      })
    }
    return () => {
      const wa = getWebApp()
      if (wa?.MainButton) {
        wa.MainButton.hide()
        wa.MainButton.offClick(() => {})
      }
    }
  }, [title])

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return

    setSubmitting(true)
    const wa = getWebApp()
    if (wa?.MainButton) wa.MainButton.showProgress()
    if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('success')

    try {
      const res = await fetch('/api/tma/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          assigned_agent_id: 'athena-strategy',
          priority: 'high',
        }),
      })

      const result = await res.json()
      if (result.success) {
        if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('success')
        if (wa?.MainButton) {
          wa.MainButton.setText('Created!')
          setTimeout(() => wa.MainButton.setText('Create Task'), 1500)
        }
        setTitle('')
        setDescription('')
      } else {
        if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('error')
        if (wa?.MainButton) wa.MainButton.setText('Failed')
      }
    } catch {
      if (wa?.MainButton) wa.MainButton.setText('Error')
    } finally {
      setSubmitting(false)
      if (wa?.MainButton) wa.MainButton.hideProgress()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/5 p-4 border-t border-white/10">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/10 rounded-lg p-3 text-sm mb-2 outline-none"
      />
      <textarea
        placeholder="Details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/10 rounded-lg p-3 text-sm mb-2 outline-none h-20 resize-none"
      />
    </div>
  )
}
```

---

### Task 10: Update next.config.mjs with CSP

**Objective:** Allow telegram.org scripts and styles.

**Files:**
- Modify: `next.config.mjs`

**Step 1: Add headers**
```js
// Add inside the existing config:
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: 'default-src \'self\'; script-src \'self\' \'unsafe-eval\' \'unsafe-inline\' https://telegram.org https://www.telegram.org; connect-src \'self\' http://127.0.0.1:8090; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; font-src \'self\' data:;' },
      ],
    },
  ]
},
```

**Step 2: Run** `npx tsc --noEmit --next --pretty`
Expected: no errors

---

### Task 11: Update kdc-next dashboard with TMA entry point

**Objective:** Add a button to launch the TMA from the existing dashboard.

**Files:**
- Modify: `src/app/page.tsx:15-30` (add TMA launch button)

**Step 1: Add import**
```tsx
import Link from 'next/link'
```

**Step 2: Add button** after the existing dashboard header
```tsx
<Link href="/tma" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
  📱 Open in Telegram
</Link>
```

---

### Task 12: Deploy to GitHub Pages with TMA route

**Objective:** Ensure TMA route works in the static export.

**Files:**
- Modify: `src/app/page.tsx` (or `next.config.mjs`) — handle static export for `/tma` route

**Step 1:** Verify `next build` still succeeds with static export:
```bash
npm run build  # (Next 15.5 static export config)
```
Expected: build succeeds

---

## Risks

1. **Telegram requires HTTPS for non-localhost** — TMA won't load `http://127.0.0.1:8090` in production. Mitigation: use Next.js API routes as proxy (Tasks 5+6 already do this).
2. **Static export limits** — `getServerSideProps` won't work with `output: 'export'`. Solution: all TMA routes use client-side fetch (no SSR data needed).
3. **initData validation requires bot token** — must be in server env, not exposed to client.

## Verification

After all tasks:
1. `npx tsc --noEmit --next --pretty` — no type errors
2. `npx next build` — succeeds
3. Open `http://localhost:3000/tma` — renders dashboard (falls back when `window.Telegram` is null)
4. In Telegram bot: `https://kingdesignshoecompany.github.io/KingDesignCollectiveinc/tma?startapp=...` — loads with real initData
