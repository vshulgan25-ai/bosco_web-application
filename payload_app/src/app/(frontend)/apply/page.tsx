import { redirect } from 'next/navigation'

import { ApplyForm } from '@/components/ApplyForm'
import { getCurrentUser, isStaffUser } from '@/lib/payload'

export const metadata = { title: 'Подати заявку · Bosco Center' }

export default async function ApplyPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  if (isStaffUser(user)) redirect('/admin')

  const today = new Date().toISOString().slice(0, 10)
  const periods = await payload.find({
    collection: 'periods',
    where: { and: [{ startDate: { less_than_equal: `${today}T23:59:59.999Z` } }, { endDate: { greater_than_equal: `${today}T00:00:00.000Z` } }] },
    limit: 1,
  })
  const period: any = periods.docs[0]

  if (period) {
    const existing = await payload.count({
      collection: 'applications',
      where: { and: [{ student: { equals: user.id } }, { period: { equals: period.id } }] },
    })
    if (existing.totalDocs > 0) redirect('/cabinet')
  }
  const programs = await payload.find({ collection: 'programs', sort: 'createdAt', pagination: false })
  const fmt = (d: string) => new Date(d).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })

  return (
    <>
      <h1>Заявка на стипендію</h1>
      {!period ? (
        <div className="notice warn">Зараз прийом заявок закритий. Заявки приймаються з 1 вересня до 24 грудня.</div>
      ) : (
        <>
          <p className="muted">{period.title} · прийом до {fmt(period.endDate)} · результати: {fmt(period.resultsDate)}</p>
          <div className="card form-box">
            <ApplyForm
              periodId={period.id}
              programs={programs.docs.map((p: any) => ({ id: p.id, name: p.name, amount: p.amount, amountNote: p.amountNote }))}
            />
          </div>
        </>
      )}
    </>
  )
}
