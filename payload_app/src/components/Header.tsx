import Link from 'next/link'

import { LogoutButton } from './LogoutButton'
import { isStaffUser } from '@/lib/payload'

export function Header({ user }: { user: any }) {
  const staff = isStaffUser(user)
  const admin = Boolean(user?.roles?.includes('admin'))
  return (
    <header className="top">
      <div className="wrap">
        <Link className="brand" href="/" title="Центр професійної освіти Боско">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bosco Center" width={170} height={60} />
        </Link>
        <nav>
          <Link href="/">Головна</Link>
          <Link href="/scholars">Стипендіати</Link>
          {user && staff && (
            <Link className="staff" href="/admin">
              {admin ? 'Панель адміністратора' : 'Панель модератора'}
            </Link>
          )}
          {user && !staff && (
            <>
              <Link href="/apply">Подати заявку</Link>
              <Link href="/cabinet">Кабінет</Link>
            </>
          )}
          {user ? (
            <LogoutButton label={`Вийти (${user.email})`} />
          ) : (
            <>
              <Link href="/login">Увійти</Link>
              <Link href="/register">Реєстрація</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
