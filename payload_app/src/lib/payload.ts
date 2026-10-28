import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export const getClient = () => getPayload({ config })

export async function getCurrentUser() {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await headers() })
  return { payload, user: (user as any) ?? null }
}

export const isStaffUser = (user: any) => Boolean(user?.roles?.some((r: string) => ['admin', 'moderator'].includes(r)))

export const fullName = (u: any) => [u?.lastName, u?.firstName].filter(Boolean).join(' ') || u?.email || ''

export const ACADEMIC_YEAR = '2025/2026'

export async function getScholarRows(year: string) {
  const payload = await getClient()
  const res = await payload.find({
    collection: 'scholarships',
    where: { and: [{ academicYear: { equals: year } }, { visible: { equals: true } }] },
    depth: 2,
    pagination: false,
    overrideAccess: true,
  })
  const rows = new Map<string, { student: any; programs: any[] }>()
  for (const s of res.docs as any[]) {
    if (!s.student || typeof s.student !== 'object') continue
    const row = rows.get(String(s.student.id)) ?? { student: s.student, programs: [] }
    row.programs.push(s.program)
    rows.set(String(s.student.id), row)
  }
  return [...rows.values()].sort((a, b) => fullName(a.student).localeCompare(fullName(b.student), 'uk'))
}
