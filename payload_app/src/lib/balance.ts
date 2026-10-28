import type { Payload } from 'payload'

/** Календарний день за київським часом (YYYY-MM-DD). */
export const kyivDay = (d: Date | string): string =>
  new Date(d).toLocaleDateString('sv-SE', { timeZone: 'Europe/Kyiv' })

export type Balance = { spent: number; total: number; balance: number; amount: number; daily: boolean }

/**
 * Витрачено: для щоденних стипендій (кафе) — за сьогодні, для решти — за весь час.
 */
export async function getBalance(payload: Payload, scholarship: any, req?: any): Promise<Balance> {
  const program =
    typeof scholarship.program === 'object'
      ? scholarship.program
      : await payload.findByID({ collection: 'programs', id: scholarship.program, depth: 0, req })

  const res = await payload.find({
    collection: 'transactions',
    where: { scholarship: { equals: scholarship.id } },
    pagination: false,
    depth: 0,
    req,
  })

  const today = kyivDay(new Date())
  const daily = Boolean(program?.isDaily)
  let spent = 0
  let total = 0
  for (const t of res.docs as any[]) {
    const amount = Number(t.amount) || 0
    total += amount
    if (!daily || kyivDay(t.createdAt) === today) spent += amount
  }
  const amount = Number(scholarship.amount) || 0
  return { spent, total, balance: amount - spent, amount, daily }
}
