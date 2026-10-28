import { APIError, type CollectionConfig } from 'payload'
import { hasRole, isAdmin, isLoggedIn, isStaff, staffOnlyField, staffOrOwn } from '../access'

const idOf = (v: any) => (v && typeof v === 'object' ? v.id : v)

export const Applications: CollectionConfig = {
  slug: 'applications',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: { defaultColumns: ['student', 'period', 'createdAt'], group: 'Заявки' },
  access: {
    create: isLoggedIn,
    read: staffOrOwn('student'),
    update: isStaff,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        const user = req.user
        if (operation === 'create' && user && !hasRole(user, 'admin', 'moderator')) {
          data.student = user.id
          // учень не може сам встановлювати рішення
          data.choices = (data.choices ?? []).map((c: any) => ({ program: c.program, status: 'pending' }))
          if (!data.choices.length) throw new APIError('Оберіть хоча б один вид стипендії.', 400)

          const period = await req.payload.findByID({ collection: 'periods', id: data.period, depth: 0, req })
          const today = new Date().toISOString().slice(0, 10)
          if (today < String(period.startDate).slice(0, 10) || today > String(period.endDate).slice(0, 10)) {
            throw new APIError('Прийом заявок у цьому наборі закрито.', 400)
          }
          const existing = await req.payload.count({
            collection: 'applications',
            where: { and: [{ student: { equals: user.id } }, { period: { equals: period.id } }] },
            req,
          })
          if (existing.totalDocs > 0) throw new APIError('Ви вже подали заявку в цьому наборі.', 400)
        }
        for (const c of data.choices ?? []) {
          if (c.status && c.status !== 'pending' && !c.decidedAt) c.decidedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req }) => {
        const payload = req.payload
        const periodId = idOf(doc.period)
        const studentId = idOf(doc.student)
        const period = await payload.findByID({ collection: 'periods', id: periodId, depth: 0, req })

        for (const c of doc.choices ?? []) {
          const programId = idOf(c.program)
          const key = `${doc.id}:${programId}`
          const existing = await payload.find({
            collection: 'scholarships',
            where: { choiceKey: { equals: key } },
            limit: 1,
            depth: 0,
            req,
          })
          if (c.status === 'approved' && existing.totalDocs === 0) {
            const program = await payload.findByID({ collection: 'programs', id: programId, depth: 0, req })
            await payload.create({
              collection: 'scholarships',
              data: {
                student: studentId,
                program: programId,
                period: periodId,
                academicYear: period.academicYear,
                amount: program.amount,
                issuedAt: period.resultsDate,
                visible: Boolean(period.resultsPublished),
                choiceKey: key,
              },
              req,
            })
          } else if (c.status !== 'approved' && existing.totalDocs > 0) {
            await payload.delete({ collection: 'scholarships', id: existing.docs[0].id, req })
          }
        }
        return doc
      },
    ],
    afterRead: [
      async ({ doc, req }) => {
        // Учень бачить рішення комісії лише після публікації результатів набору
        if (!req.user || hasRole(req.user, 'admin', 'moderator')) return doc
        const period =
          typeof doc.period === 'object' && doc.period
            ? doc.period
            : await req.payload.findByID({ collection: 'periods', id: doc.period, depth: 0, req })
        if (period?.resultsPublished) return doc
        return {
          ...doc,
          choices: (doc.choices ?? []).map((c: any) => ({ ...c, status: 'pending', comment: '', decidedAt: null })),
        }
      },
    ],
  },
  fields: [
    { name: 'student', label: 'Учень', type: 'relationship', relationTo: 'users', required: true },
    { name: 'period', label: 'Набір', type: 'relationship', relationTo: 'periods', required: true },
    { name: 'motivation', label: 'Мотиваційний лист', type: 'textarea', required: true },
    {
      name: 'portfolio',
      label: 'Портфоліо',
      type: 'array',
      maxRows: 5,
      fields: [
        { name: 'title', label: 'Назва (грамота, сертифікат, проєкт…)', type: 'text', required: true },
        { name: 'file', label: 'Файл', type: 'upload', relationTo: 'media', required: true },
      ],
    },
    {
      name: 'choices',
      label: 'Вибрані стипендії та рішення комісії',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'program', label: 'Стипендія', type: 'relationship', relationTo: 'programs', required: true },
        {
          name: 'status',
          label: 'Статус',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'На розгляді', value: 'pending' },
            { label: 'Схвалено', value: 'approved' },
            { label: 'Відхилено', value: 'rejected' },
          ],
          access: { create: staffOnlyField, update: staffOnlyField },
        },
        { name: 'comment', label: 'Коментар комісії', type: 'textarea', access: { create: staffOnlyField, update: staffOnlyField } },
        { name: 'decidedAt', label: 'Дата рішення', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
}
