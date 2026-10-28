import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Вхід · Bosco Center' }

export default function LoginPage() {
  return (
    <>
      <h1>Вхід до системи</h1>
      <div className="card form-box">
        <AuthForm mode="login" />
        <p className="muted">Немає акаунта? <Link href="/register">Зареєструватися</Link></p>
        <p className="muted">Адміністратор і модератори входять тут же — їх буде перенаправлено до панелі керування.</p>
      </div>
    </>
  )
}
