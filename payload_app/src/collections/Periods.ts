import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Periods: CollectionConfig = {
  slug: 'periods',
  labels: { singular: 'Набір на стипендії', plural: 'Набори на стипендії' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'academicYear', 'startDate', 'endDate', 'resultsPublished'], group: 'Стипендії' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        // Публікація/приховування результатів керує видимістю стипендій для учнів
        if (previousDoc && previousDoc.resultsPublished !== doc.resultsPublished) {
          await req.payload.update({
            collection: 'scholarships',
            where: { period: { equals: doc.id } },
            data: { visible: Boolean(doc.resultsPublished) },
            req,
          })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Назва набору', type: 'text', required: true },
    { name: 'academicYear', label: 'Навчальний рік', type: 'text', required: true, defaultValue: '2025/2026' },
    { name: 'startDate', label: 'Початок прийому заявок', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'endDate', label: 'Кінець прийому заявок', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'resultsDate', label: 'Дата оголошення результатів', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'resultsPublished', label: 'Результати опубліковано для учнів', type: 'checkbox', defaultValue: false },
  ],
}
