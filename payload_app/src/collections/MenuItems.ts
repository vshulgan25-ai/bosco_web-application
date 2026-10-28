import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '../access'

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  labels: { singular: 'Позиція меню', plural: 'Меню кафе «Мама Маргарита»' },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'price', 'available'], group: 'Стипендії' },
  access: { read: anyone, create: isStaff, update: isStaff, delete: isStaff },
  fields: [
    { name: 'name', label: 'Страва / напій', type: 'text', required: true },
    { name: 'description', label: 'Опис', type: 'text' },
    { name: 'price', label: 'Ціна (грн)', type: 'number', required: true, min: 0 },
    { name: 'available', label: 'Доступно', type: 'checkbox', defaultValue: true },
  ],
}
