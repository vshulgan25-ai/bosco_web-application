import type { CollectionConfig } from 'payload'
import { adminOnlyField, anyone, hasRole, isAdmin, staffOrOwn } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  auth: { tokenExpiration: 60 * 60 * 12, maxLoginAttempts: 8, lockTime: 10 * 60 * 1000 },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['lastName', 'firstName', 'group', 'course', 'roles'],
    group: 'Система',
  },
  access: {
    admin: ({ req: { user } }) => hasRole(user, 'admin', 'moderator'),
    create: anyone, // самореєстрація учнів; роль обмежена полем roles
    read: staffOrOwn('id'),
    update: staffOrOwn('id'),
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Перший створений користувач стає адміністратором
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.roles = ['admin']
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'lastName', label: 'Прізвище', type: 'text', required: true },
    { name: 'firstName', label: "Ім'я", type: 'text', required: true },
    { name: 'group', label: 'Група', type: 'text' },
    { name: 'course', label: 'Курс', type: 'number', min: 1, max: 2, defaultValue: 2 },
    { name: 'phone', label: 'Телефон', type: 'text' },
    {
      name: 'roles',
      label: 'Ролі',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['student'],
      saveToJWT: true,
      options: [
        { label: 'Адміністратор', value: 'admin' },
        { label: 'Модератор', value: 'moderator' },
        { label: 'Учень', value: 'student' },
      ],
      access: { create: adminOnlyField, update: adminOnlyField },
    },
  ],
}
