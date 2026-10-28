'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Program = { id: string | number; name: string; amount: number; amountNote?: string }

export function ApplyForm({ periodId, programs }: { periodId: string | number; programs: Program[] }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const f = new FormData(e.currentTarget)
    try {
      const chosen = f.getAll('program')
      if (!chosen.length) throw new Error('Оберіть хоча б один вид стипендії.')

      // 1) завантаження файлів портфоліо
      const portfolio: { title: string; file: string | number }[] = []
      for (let i = 0; i < 3; i++) {
        const file = f.get(`file_${i}`) as File | null
        const title = String(f.get(`title_${i}`) || '').trim()
        if (file && file.size > 0) {
          if (file.size > 5 * 1024 * 1024) throw new Error('Розмір файлу не повинен перевищувати 5 МБ.')
          const body = new FormData()
          body.append('file', file)
          body.append('_payload', JSON.stringify({ alt: title || file.name }))
          const up = await fetch('/api/media', { method: 'POST', body })
          const data = await up.json().catch(() => null)
          if (!up.ok) throw new Error(data?.errors?.[0]?.message || 'Не вдалося завантажити файл.')
          portfolio.push({ title: title || file.name, file: data.doc.id })
        }
      }

      // 2) сама заявка
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: periodId,
          motivation: f.get('motivation'),
          choices: chosen.map((program) => ({ program })),
          portfolio,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.errors?.[0]?.message || 'Не вдалося надіслати заявку.')
      router.push('/cabinet')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      {error && <div className="msg error">{error}</div>}
      <div className="checks">
        <label>Оберіть стипендії (можна одну, дві або всі)</label>
        <ul>
          {programs.map((p) => (
            <li key={p.id}>
              <label>
                <input type="checkbox" name="program" value={String(p.id)} /> {p.name} — {p.amount} грн {p.amountNote}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <p style={{ marginTop: 14 }}>
        <label htmlFor="motivation">Мотиваційний лист</label>
        <textarea id="motivation" name="motivation" rows={6} required placeholder="Розкажіть, чому саме ви заслуговуєте на стипендію…" />
      </p>
      <h3>Портфоліо</h3>
      <p className="muted">Додайте до трьох документів: грамоти, сертифікати, проєкти (PDF, JPG, PNG).</p>
      {[0, 1, 2].map((i) => (
        <div className="port-row" key={i}>
          <p><label htmlFor={`title_${i}`}>Назва</label><input id={`title_${i}`} name={`title_${i}`} type="text" /></p>
          <p><input name={`file_${i}`} type="file" accept="application/pdf,image/*" /></p>
        </div>
      ))}
      <button className="btn" type="submit" disabled={busy}>{busy ? 'Надсилання…' : 'Надіслати заявку'}</button>
    </form>
  )
}
