import type { CollectionConfig } from 'payload'
import { anyone, isAdmin } from '../access'

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Стипендіальна програма', plural: 'Стипендіальні програми' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'kind', 'amount', 'amountNote'], group: 'Стипендії' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', label: 'Назва програми', type: 'text', required: true },
    {
      name: 'kind',
      label: 'Напрям',
      type: 'select',
      required: true,
      unique: true,
      options: [
        { label: 'Навчання в закладі', value: 'tuition' },
        { label: 'Колегіум', value: 'collegium' },
        { label: 'Харчування в кафе «Мама Маргарита»', value: 'cafe' },
      ],
    },
    { name: 'description', label: 'Опис', type: 'textarea' },
    { name: 'amount', label: 'Розмір стипендії (грн)', type: 'number', required: true, min: 0 },
    { name: 'amountNote', label: 'Примітка до суми (за модуль, щодня…)', type: 'text' },
  ],
}
