import { getPayload } from 'payload'
import config from './payload.config'

const ACADEMIC_YEAR = '2025/2026'
const STUDENT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Bosco2026!'

const PROGRAMS = [
  {
    kind: 'tuition',
    name: 'Стипендія на навчання',
    amount: 10000,
    amountNote: 'за модуль',
    description: 'Часткова оплата навчання в Центрі професійної освіти Боско за модуль.',
  },
  {
    kind: 'collegium',
    name: 'Стипендія на колегіум',
    amount: 4000,
    amountNote: '',
    description: 'Покриття проживання в колегіумі.',
  },
  {
    kind: 'cafe',
    name: 'Харчування в кафе «Мама Маргарита»',
    amount: 200,
    amountNote: 'щодня',
    description: 'Харчування в кафе «Мама Маргарита».',
  },
]

const SCHOLARS = [
  {
    email: 'shulhan.veronika@bosco.local',
    firstName: 'Вероніка',
    lastName: 'Шульган',
    group: 'ІТ-22',
    course: 2,
    programs: ['collegium', 'tuition', 'cafe'],
  },
  {
    email: 'fedash.tereza@bosco.local',
    firstName: 'Тереза',
    lastName: 'Федаш',
    group: 'ІТ-21',
    course: 2,
    programs: ['tuition', 'cafe'],
  },
]

async function main() {
  const payload = await getPayload({ config })

  const ensureUser = async (email: string, data: Record<string, any>) => {
    const found = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
    if (found.docs[0]) return found.docs[0]
    return payload.create({ collection: 'users', data: { email, ...data } as any })
  }

  await ensureUser('admin@bosco.local', {
    password: 'admin12345', firstName: 'Адміністратор', lastName: 'Системи', roles: ['admin'],
  })
  await ensureUser('moderator@bosco.local', {
    password: 'moderator12345', firstName: 'Модератор', lastName: 'Стипендіальної комісії', roles: ['moderator'],
  })

  const programs: Record<string, any> = {}
  for (const p of PROGRAMS) {
    const found = await payload.find({ collection: 'programs', where: { kind: { equals: p.kind } }, limit: 1 })
    programs[p.kind] = found.docs[0] ?? (await payload.create({ collection: 'programs', data: p as any }))
  }

  const periodDefs = [
    {
      title: 'Набір на стипендії 2025/2026', academicYear: '2025/2026',
      startDate: '2025-09-01T09:00:00.000Z', endDate: '2025-12-24T09:00:00.000Z',
      resultsDate: '2026-01-31T09:00:00.000Z', resultsPublished: true,
    },
    {
      title: 'Набір на стипендії 2026/2027', academicYear: '2026/2027',
      startDate: '2026-09-01T09:00:00.000Z', endDate: '2026-12-24T09:00:00.000Z',
      resultsDate: '2027-01-31T09:00:00.000Z', resultsPublished: false,
    },
  ]
  const periods: any[] = []
  for (const d of periodDefs) {
    const found = await payload.find({ collection: 'periods', where: { title: { equals: d.title } }, limit: 1 })
    periods.push(found.docs[0] ?? (await payload.create({ collection: 'periods', data: d })))
  }
  const pastPeriod = periods[0]

  for (const s of SCHOLARS) {
    const user = await ensureUser(s.email, {
      password: STUDENT_PASSWORD, firstName: s.firstName, lastName: s.lastName,
      group: s.group, course: s.course, roles: ['student'],
    })

    const existing = await payload.find({
      collection: 'applications',
      where: { and: [{ student: { equals: user.id } }, { period: { equals: pastPeriod.id } }] },
      limit: 1,
    })
    if (existing.docs[0]) continue

    // Схвалені рішення; хук застосунку автоматично створить стипендії
    await payload.create({
      collection: 'applications',
      data: {
        student: user.id,
        period: pastPeriod.id,
        motivation: `Заявка стипендіата ${ACADEMIC_YEAR} навчального року.`,
        choices: s.programs.map((kind) => ({
          program: programs[kind].id,
          status: 'approved',
          comment: 'Вітаємо зі стипендією!',
        })),
      },
    })
  }

  payload.logger.info('Початкові дані створено.')
  payload.logger.info('admin@bosco.local / admin12345 (адміністратор)')
  payload.logger.info('moderator@bosco.local / moderator12345 (модератор)')
  for (const s of SCHOLARS) payload.logger.info(`${s.email} / ${STUDENT_PASSWORD} — ${s.lastName} ${s.firstName}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
