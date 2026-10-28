'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/users/logout', { method: 'POST' })
        router.push('/')
        router.refresh()
      }}
    >
      {label}
    </button>
  )
}
