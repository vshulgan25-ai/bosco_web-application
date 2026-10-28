import type { CollectionConfig } from 'payload'
import { isAdmin, isLoggedIn, staffOrOwn } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Файл портфоліо', plural: 'Файли портфоліо' },
  admin: { group: 'Заявки' },
  access: { create: isLoggedIn, read: staffOrOwn('owner'), update: isAdmin, delete: isAdmin },
  upload: {
    staticDir: 'media',
    mimeTypes: ['application/pdf', 'image/*'],
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user) data.owner = req.user.id
        return data
      },
    ],
  },
  fields: [
    { name: 'alt', label: 'Назва (грамота, сертифікат…)', type: 'text' },
    { name: 'owner', type: 'relationship', relationTo: 'users', admin: { readOnly: true } },
  ],
}
