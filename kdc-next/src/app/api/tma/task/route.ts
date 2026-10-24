import { NextRequest, NextResponse } from 'next/server'

const KDOS_API = 'http://127.0.0.1:8090'

export async function POST(req: NextRequest) {
  const { title, description, assigned_agent_id, priority } = await req.json()

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${KDOS_API}/api/v1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || '',
        assigned_agent_id,
        priority: priority || 'normal',
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    const result = await res.json()
    return NextResponse.json({ success: true, task: result })
  } catch (e) {
    return NextResponse.json({ error: 'OS API unreachable' }, { status: 503 })
  }
}
