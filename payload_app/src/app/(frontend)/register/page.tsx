import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export const metadata = { title: 'Реєстрація · Bosco Center' }

export default function RegisterPage() {
  return (
    <>
      <h1>Реєстрація учня</h1>
      <div className="card form-box">
        <AuthForm mode="register" />
        <p className="muted">Вже є акаунт? <Link href="/login">Увійти</Link></p>
      </div>
    </>
  )
}
