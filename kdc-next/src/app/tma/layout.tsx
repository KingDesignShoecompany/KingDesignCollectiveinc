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

      return () => clearInterval(checkReady)
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
