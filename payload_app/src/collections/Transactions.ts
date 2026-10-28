import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, isStaff } from '../access'
import { getBalance } from '../lib/balance'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  labels: { singular: 'Витрата', plural: 'Витрати' },
  admin: { useAsTitle: 'description', defaultColumns: ['scholarship', 'description', 'quantity', 'amount', 'createdAt'], group: 'Стипендії' },
  access: { read: isStaff, create: isStaff, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data?.scholarship) {
          const scholarship = await req.payload.findByID({ collection: 'scholarships', id: data.scholarship, depth: 1, req })
          const { balance } = await getBalance(req.payload, scholarship, req)
          if (Number(data.amount) > balance) {
            throw new APIError('Сума витрати перевищує доступний залишок стипендії.', 400)
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'scholarship', label: 'Стипендія', type: 'relationship', relationTo: 'scholarships', required: true, index: true },
    { name: 'description', label: 'Опис витрати', type: 'text', required: true },
    { name: 'quantity', label: 'Кількість', type: 'number', defaultValue: 1, min: 1 },
    { name: 'amount', label: 'Сума (грн)', type: 'number', required: true, min: 0 },
  ],
}
