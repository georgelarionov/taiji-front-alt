'use client'

import React, { useState } from 'react'

// Кнопка «Опубликовать на сайте» в боковом меню админки.
//
// Сайт статический: правки в CMS попадают на него со следующей сборкой. Кнопка
// просит Railway пересобрать сервис web — обычно это занимает 2–4 минуты
// (как именно устроен запуск и почему не просто redeploy — см. lib/railway.ts).

type State = 'idle' | 'sending' | 'done' | 'error'

const MESSAGES: Record<Exclude<State, 'idle' | 'sending'>, string> = {
  done: 'Сборка запущена — сайт обновится через 2–4 минуты.',
  error: '',
}

export const RebuildButton: React.FC = () => {
  const [state, setState] = useState<State>('idle')
  const [error, setError] = useState('')

  const publish = async () => {
    setState('sending')
    setError('')

    try {
      const res = await fetch('/api/rebuild-site', {
        method: 'POST',
        credentials: 'include',
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || `Не получилось: сервер ответил ${res.status}.`)
        setState('error')
        return
      }

      setState('done')
    } catch {
      setError('Сеть недоступна — попробуйте ещё раз.')
      setState('error')
    }
  }

  return (
    <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      <button
        type="button"
        onClick={publish}
        disabled={state === 'sending'}
        className="btn btn--style-primary btn--size-small"
        style={{ margin: 0, width: '100%' }}
      >
        {state === 'sending' ? 'Запускаю сборку…' : 'Опубликовать на сайте'}
      </button>

      {state === 'done' && (
        <span style={{ fontSize: '.8rem', opacity: 0.75 }}>{MESSAGES.done}</span>
      )}
      {state === 'error' && (
        <span style={{ fontSize: '.8rem', color: 'var(--theme-error-500)' }}>{error}</span>
      )}
    </div>
  )
}

export default RebuildButton
