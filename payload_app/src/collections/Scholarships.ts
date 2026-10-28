import type { CollectionConfig } from 'payload'
import { isAdmin, isStaff, hasRole } from '../access'

export const Scholarships: CollectionConfig = {
  slug: 'scholarships',
  labels: { singular: 'Стипендія', plural: 'Стипендії учнів' },
  admin: { defaultColumns: ['student', 'program', 'academicYear', 'amount', 'visible'], group: 'Стипендії' },
  access: {
    create: isStaff,
    update: isStaff,
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (hasRole(user, 'admin', 'moderator')) return true
      return { and: [{ student: { equals: user.id } }, { visible: { equals: true } }] }
    },
  },
  fields: [
    { name: 'student', label: 'Учень', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'program', label: 'Програма', type: 'relationship', relationTo: 'programs', required: true },
    { name: 'period', label: 'Набір', type: 'relationship', relationTo: 'periods' },
    { name: 'academicYear', label: 'Навчальний рік', type: 'text', required: true, index: true, defaultValue: '2025/2026' },
    { name: 'amount', label: 'Призначена сума (грн)', type: 'number', required: true, min: 0 },
    { name: 'issuedAt', label: 'Дата призначення', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'visible', label: 'Видима для учня (результати опубліковано)', type: 'checkbox', defaultValue: false, index: true },
    { name: 'choiceKey', label: 'Ключ рішення комісії', type: 'text', unique: true, admin: { readOnly: true, position: 'sidebar' } },
  ],
}
