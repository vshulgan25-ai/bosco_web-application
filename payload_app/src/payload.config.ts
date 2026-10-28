import path from 'path'
import { fileURLToPath } from 'url'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Applications } from './collections/Applications'
import { Media } from './collections/Media'
import { Periods } from './collections/Periods'
import { Programs } from './collections/Programs'
import { Scholarships } from './collections/Scholarships'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || undefined,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — Bosco Center',
      icons: [{ rel: 'icon', type: 'image/png', url: '/logo.png' }],
    },
  },
  collections: [Users, Programs, Periods, Applications, Scholarships, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URI || 'file:./bosco.db' } }),
  i18n: { supportedLanguages: { uk, en }, fallbackLanguage: 'uk' },
  sharp,
})
