import { NextRequest, NextResponse } from 'next/server'
import { validateInitData } from '../../../../lib/tma-server'

const KDOS_API = 'http://127.0.0.1:8090'

export async function POST(req: NextRequest) {
  const { initData } = await req.json()

  if (!initData) {
    return NextResponse.json({ error: 'No initData provided' }, { status: 400 })
  }

  const user = validateInitData(initData as string)
  if (!user) {
    return NextResponse.json({ error: 'Invalid initData' }, { status: 401 })
  }

  // Fetch company status from kdos API
  let companyData = { error: 'OS API unavailable' }
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${KDOS_API}/api/v1/dashboard`, {
      signal: controller.signal,
    })
    if (res.ok) {
      companyData = await res.json()
    }
  } catch {}

  return NextResponse.json({
    user: user.user,
    chat: user.chat,
    start_param: user.start_param,
    query_id: user.query_id,
    company: companyData,
  })
}
