import Link from 'next/link'

import { ScholarTable } from '@/components/ScholarTable'
import { ACADEMIC_YEAR, getClient, getCurrentUser, getScholarRows, isStaffUser } from '@/lib/payload'

const fmt = (d: string) => new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' })

export default async function HomePage() {
  const payload = await getClient()
  const { user } = await getCurrentUser()
  const staff = isStaffUser(user)

  const [programs, periods, rows] = await Promise.all([
    payload.find({ collection: 'programs', sort: 'createdAt', pagination: false }),
    payload.find({ collection: 'periods', sort: '-startDate', pagination: false }),
    getScholarRows(ACADEMIC_YEAR),
  ])
  const now = Date.now()
  const open = periods.docs.find((p: any) => new Date(p.startDate).getTime() <= now && now <= new Date(p.endDate).getTime() + 86400000)
  const period: any = open ?? periods.docs[0]

  return (
    <>
      <section className="hero">
        <h1>Стипендіальні програми Bosco Center</h1>
        <p>
          Подайте заявку з портфоліо на одну, дві або всі стипендії, дізнайтеся результат і керуйте своєю стипендією в
          особистому кабінеті: навчання, колегіум та харчування в кафе «Мама Маргарита».
        </p>
        {user && !staff && (<><Link className="btn light" href="/apply">Подати заявку</Link>{' '}<Link className="btn light" href="/cabinet">Мій кабінет</Link></>)}
        {staff && <Link className="btn light" href="/admin">Панель керування</Link>}
        {!user && (<><Link className="btn light" href="/register">Створити акаунт</Link>{' '}<Link className="btn light" href="/login">Увійти</Link></>)}
      </section>

      {period ? (
        <>
          <h2 style={{ marginTop: 0 }}>{period.title}</h2>
          <div className="timeline">
            <div>Прийом заявок<b>{fmt(period.startDate)} – {fmt(period.endDate)}</b>{open ? <span className="badge approved">Відкрито</span> : <span className="badge rejected">Закрито</span>}</div>
            <div>Розгляд заявок<b>комісією</b><span className="muted">заявки перебувають на розгляді</span></div>
            <div>Оголошення стипендій<b>{fmt(period.resultsDate)}</b><span className="muted">результати з’являться в кабінеті</span></div>
          </div>
        </>
      ) : (
        <div className="notice warn">Наразі набір на стипендії не оголошено. Слідкуйте за оновленнями.</div>
      )}

      <h2>Види стипендій</h2>
      <div className="grid">
        {programs.docs.map((p: any) => (
          <div className="card" key={p.id}>
            <h3>{p.name}</h3>
            <p>{p.description}</p>
            <p className="big">{p.amount} грн <span className="muted" style={{ fontSize: '1rem', fontWeight: 400 }}>{p.amountNote}</span></p>
          </div>
        ))}
      </div>
      <div className="notice">Можна подати заявку на <strong>одну, дві або всі три</strong> стипендії одночасно.</div>

      <h2>Стипендіати {ACADEMIC_YEAR}</h2>
      <ScholarTable rows={rows} />
      <p><Link href="/scholars">Усі стипендіати →</Link></p>
    </>
  )
}
