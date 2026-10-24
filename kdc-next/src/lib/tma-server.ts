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

    if (computedHash !== hash) return null

    const authDate = parseInt(params.get('auth_date') || '0', 10)
    // Reject if auth_date is older than 24h
    if (Date.now() / 1000 - authDate > 86400) return null

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
