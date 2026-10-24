'use client'

import { useState, useEffect } from 'react'
import { getWebApp } from '../../lib/tma-client'

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
        if (title.trim() && !submitting) {
          handleSubmit()
        }
      })
    }
    return () => {
      const wa = getWebApp()
      if (wa?.MainButton) {
        wa.MainButton.hide()
      }
    }
  }, [title, submitting])

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return

    setSubmitting(true)
    const wa = getWebApp()

    if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('success')
    if (wa?.MainButton) wa.MainButton.showProgress()

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
          setTimeout(() => wa?.MainButton?.setText('Create Task'), 1500)
        }
        setTitle('')
        setDescription('')
      } else {
        if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('error')
        if (wa?.MainButton) wa.MainButton.setText('Failed')
      }
    } catch {
      if (wa?.HapticFeedback) wa.HapticFeedback.notificationOccurred('error')
      if (wa?.MainButton) wa.MainButton.setText('Error')
    } finally {
      setSubmitting(false)
      if (wa?.MainButton) wa.MainButton.hideProgress()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/5 p-4 border-t border-white/10 safe-area-bottom">
      <input
        type="text"
        placeholder="What needs to be done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-white/10 rounded-lg p-3 text-sm mb-2 outline-none placeholder:opacity-50"
      />
      <textarea
        placeholder="Details (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/10 rounded-lg p-3 text-sm mb-2 outline-none h-20 resize-none placeholder:opacity-50"
      />
    </div>
  )
}
