import Link from 'next/link'
import { redirect } from 'next/navigation'

import { fullName, getCurrentUser, isStaffUser } from '@/lib/payload'

export const metadata = { title: 'Особистий кабінет · Bosco Center' }

const STATUS: Record<string, string> = { pending: 'На розгляді', approved: 'Схвалено', rejected: 'Відхилено' }
const date = (d: string) => new Date(d).toLocaleDateString('uk-UA', { timeZone: 'Europe/Kyiv' })

export default async function CabinetPage() {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  if (isStaffUser(user)) redirect('/admin')

  const [schRes, appRes] = await Promise.all([
    payload.find({
      collection: 'scholarships',
      where: { and: [{ student: { equals: user.id } }, { visible: { equals: true } }] },
      depth: 1,
      pagination: false,
    }),
    payload.find({
      collection: 'applications',
      where: { student: { equals: user.id } },
      depth: 2,
      sort: '-createdAt',
      pagination: false,
    }),
  ])

  // Рішення приховані до публікації результатів набору
  const applications = (appRes.docs as any[]).map((a) => ({
    ...a,
    choices: (a.choices ?? []).map((c: any) =>
      a.period?.resultsPublished ? c : { ...c, status: 'pending', comment: '' },
    ),
  }))
  const pending = applications.flatMap((a) =>
    a.choices.filter((c: any) => c.status === 'pending').map((c: any) => ({ c, period: a.period })),
  )

  return (
    <>
      <h1>Особистий кабінет</h1>
      <p className="muted">
        {fullName(user)}
        {user.group ? ` · група ${user.group}` : ''}
        {user.course ? ` · ${user.course} курс` : ''}
      </p>

      {pending.length > 0 && (
        <div className="notice warn">
          <strong>Заявки на розгляді:</strong> {pending.map(({ c }) => c.program?.name).join(', ')}. Результати будуть
          оголошені <strong>{date(pending[0].period.resultsDate)}</strong>.
        </div>
      )}

      <h2>Мої стипендії</h2>
      {schRes.docs.length ? (
        <div className="grid">
          {(schRes.docs as any[]).map((s) => (
            <div className="card" key={s.id}>
              <h3>{s.program.name}</h3>
              <p className="muted">
                {s.academicYear} · призначено {s.issuedAt ? date(s.issuedAt) : '—'}
              </p>
              <p className="big">
                {s.amount} грн{' '}
                <span className="muted" style={{ fontSize: '.95rem', fontWeight: 400 }}>
                  {s.program.amountNote}
                </span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="notice">Стипендій поки немає. Після оголошення результатів вони з’являться тут.</div>
      )}

      <h2>Мої заявки</h2>
      {applications.length ? (
        applications.map((a) => (
          <div className="card" style={{ marginBottom: 16 }} key={a.id}>
            <h3>{a.period?.title}</h3>
            <p className="muted">Подано {new Date(a.createdAt).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}</p>
            <div className="scroll">
              <table>
                <thead>
                  <tr><th>Стипендія</th><th>Статус</th></tr>
                </thead>
                <tbody>
                  {a.choices.map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.program?.name}</td>
                      <td>
                        <span className={`badge ${c.status}`}>{STATUS[c.status]}</span>
                        {c.comment && <div className="muted">{c.comment}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <div className="notice">Ви ще не подавали заявок. <Link href="/apply">Подати заявку</Link></div>
      )}
    </>
  )
}
