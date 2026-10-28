import type { Metadata } from 'next'
import React from 'react'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getCurrentUser } from '@/lib/payload'
import './theme.css'

export const metadata: Metadata = {
  title: 'Стипендії · Bosco Center',
  description: 'Система управління стипендіальними програмами Центру професійної освіти Боско',
  icons: { icon: '/logo.png' },
}

export const dynamic = 'force-dynamic'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUser()
  return (
    <html lang="uk">
      <body>
        <Header user={user} />
        <main>
          <div className="wrap">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  )
}
