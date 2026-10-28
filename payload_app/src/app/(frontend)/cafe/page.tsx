import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getBalance, kyivDay } from '@/lib/balance'
import { getCurrentUser, isStaffUser } from '@/lib/payload'

export const metadata = { title: 'Мама Маргарита · Bosco Center' }

const money = (n: number) => n.toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function findCafeScholarship(payload: any, userId: string | number) {
  const res = await payload.find({
    collection: 'scholarships',
    where: { and: [{ student: { equals: userId } }, { visible: { equals: true } }, { 'program.kind': { equals: 'cafe' } }] },
    depth: 1, limit: 1,
  })
  return res.docs[0] as any
}

async function placeOrder(formData: FormData) {
  'use server'
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  const scholarship = await findCafeScholarship(payload, user.id)
  if (!scholarship) redirect('/cafe')

  const items = await payload.find({ collection: 'menu-items', where: { available: { equals: true } }, pagination: false })
  const order: { item: any; qty: number }[] = []
  let total = 0
  for (const item of items.docs as any[]) {
    const qty = Math.max(0, Math.min(20, parseInt(String(formData.get(`qty_${item.id}`) || '0'), 10) || 0))
    if (qty) { order.push({ item, qty }); total += item.price * qty }
  }
  if (!order.length) redirect('/cafe?error=' + encodeURIComponent('Ви нічого не обрали.'))

  const { balance } = await getBalance(payload, scholarship)
  if (total > balance) {
    redirect('/cafe?error=' + encodeURIComponent(`Недостатньо коштів на сьогодні: замовлення ${money(total)} грн, доступно ${money(balance)} грн.`))
  }
  for (const { item, qty } of order) {
    await payload.create({
      collection: 'transactions',
      data: { scholarship: scholarship.id, description: `Мама Маргарита: ${item.name}`, quantity: qty, amount: item.price * qty },
    })
  }
  redirect('/cafe?ok=' + encodeURIComponent(`Замовлення оформлено на ${money(total)} грн.`))
}

export default async function CafePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { payload, user } = await getCurrentUser()
  if (!user) redirect('/login')
  if (isStaffUser(user)) redirect('/admin')
  const { ok, error } = await searchParams

  const scholarship = await findCafeScholarship(payload, user.id)
  if (!scholarship) {
    return (
      <>
        <h1>Кафе «Мама Маргарита»</h1>
        <div className="notice warn">У вас немає стипендії на харчування в кафе «Мама Маргарита».</div>
      </>
    )
  }

  const [b, menu, txs] = await Promise.all([
    getBalance(payload, scholarship),
    payload.find({ collection: 'menu-items', where: { available: { equals: true } }, sort: 'name', pagination: false }),
    payload.find({ collection: 'transactions', where: { scholarship: { equals: scholarship.id } }, sort: '-createdAt', limit: 50, depth: 0 }),
  ])
  const today = kyivDay(new Date())
  const todays = (txs.docs as any[]).filter((t) => kyivDay(t.createdAt) === today)
  const pct = b.amount ? Math.min(100, Math.round((b.spent / b.amount) * 100)) : 0

  return (
    <>
      <h1>Кафе «Мама Маргарита»</h1>
      {ok && <div className="msg success">{ok}</div>}
      {error && <div className="msg error">{error}</div>}
      <div className="card">
        <div className="nums"><span>Доступно сьогодні (ліміт {b.amount} грн на день):</span><span className="big">{money(b.balance)} грн</span></div>
        <div className="bar"><div style={{ width: `${pct}%` }} /></div>
        <div className="muted">Сьогодні витрачено {money(b.spent)} з {money(b.amount)} грн. Завтра ліміт оновиться.</div>
      </div>

      <h2>Меню</h2>
      <form action={placeOrder} className="card">
        {menu.docs.map((item: any) => (
          <div className="menu-row" key={item.id}>
            <div><strong>{item.name}</strong><div className="muted">{item.description}</div></div>
            <div>{money(item.price)} грн &nbsp;<input type="number" min={0} max={20} defaultValue={0} name={`qty_${item.id}`} className="qty" /></div>
          </div>
        ))}
        {!menu.docs.length && <p className="muted">Меню порожнє.</p>}
        <p className="muted" style={{ marginTop: 16 }}>Сума замовлення перевіряється сервером і не може перевищувати доступний залишок.</p>
        <button className="btn" type="submit">Оформити замовлення</button>
      </form>

      <h2>Сьогоднішні покупки</h2>
      {todays.length ? (
        <div className="scroll"><table>
          <thead><tr><th>Час</th><th>Позиція</th><th>К-сть</th><th>Сума</th></tr></thead>
          <tbody>{todays.map((t) => (
            <tr key={t.id}><td>{new Date(t.createdAt).toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit' })}</td><td>{t.description}</td><td>{t.quantity}</td><td>{money(t.amount)} грн</td></tr>
          ))}</tbody>
        </table></div>
      ) : <p className="muted">Сьогодні покупок ще не було.</p>}
      <p><Link href="/cabinet">← До кабінету</Link></p>
    </>
  )
}
