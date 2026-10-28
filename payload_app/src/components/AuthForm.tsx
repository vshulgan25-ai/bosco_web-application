'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const f = new FormData(e.currentTarget)
    const email = String(f.get('email'))
    const password = String(f.get('password'))

    try {
      if (mode === 'register') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            firstName: f.get('firstName'),
            lastName: f.get('lastName'),
            group: f.get('group'),
            course: f.get('course') ? Number(f.get('course')) : undefined,
            phone: f.get('phone') || undefined,
          }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.errors?.[0]?.message || 'Не вдалося створити акаунт.')
        }
      }
      const login = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await login.json().catch(() => null)
      if (!login.ok) throw new Error(data?.errors?.[0]?.message || 'Невірний email або пароль.')
      const staff = data?.user?.roles?.some((r: string) => r === 'admin' || r === 'moderator')
      router.push(staff ? '/admin' : '/cabinet')
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
      {mode === 'register' && (
        <>
          <p><label htmlFor="lastName">Прізвище</label><input id="lastName" name="lastName" type="text" required /></p>
          <p><label htmlFor="firstName">Ім&apos;я</label><input id="firstName" name="firstName" type="text" required /></p>
          <p><label htmlFor="group">Група (наприклад, ІТ-21)</label><input id="group" name="group" type="text" required /></p>
          <p>
            <label htmlFor="course">Курс</label>
            <select id="course" name="course" defaultValue="">
              <option value="">— не вказано —</option>
              {[1, 2].map((c) => <option key={c} value={c}>{c} курс</option>)}
            </select>
          </p>
          <p><label htmlFor="phone">Телефон</label><input id="phone" name="phone" type="text" /></p>
        </>
      )}
      <p><label htmlFor="email">Email</label><input id="email" name="email" type="email" required /></p>
      <p><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" minLength={8} required /></p>
      <button className="btn" type="submit" disabled={busy}>{mode === 'login' ? 'Увійти' : 'Зареєструватися'}</button>
    </form>
  )
}
