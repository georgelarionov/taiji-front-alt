// Конфигурация Payload для сайта Общества изучения традиционного тайцзицюань.
//
// Контент отсюда потребляет статическая сборка apps/web: на билде она читает REST
// (`/api/<collection>`) и мапит ответ в те же типы, что раньше лежали в src/data.
// Поэтому имена полей осознанно повторяют форму фронтенда — маппер остаётся тонким.
//
// Интерфейс админки — русский (i18n.fallbackLanguage='ru'); контент одноязычный,
// localization не включаем.

import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { ru } from '@payloadcms/translations/languages/ru'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Documents } from './collections/Documents'
import { News } from './collections/News'
import { Videos } from './collections/Videos'
import { Research } from './collections/Research'
import { Events } from './collections/Events'
import { Team } from './collections/Team'
import { Persons } from './collections/Persons'
import { TaijiSources } from './collections/TaijiSources'
import { Partners } from './collections/Partners'

import { SiteSettings } from './globals/SiteSettings'
import { Home } from './globals/Home'
import { AboutBlock } from './globals/AboutBlock'
import { SocietyPage } from './globals/SocietyPage'
import { ContactsPage } from './globals/ContactsPage'
import { Navigation } from './globals/Navigation'

import { rebuildEndpoint } from './endpoints/rebuild'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Адрес самой CMS: нужен для абсолютных URL медиафайлов в ответах API — сборка сайта
// ходит сюда за картинками. На Railway приходит из переменной сервиса.
const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Домен сайта — в CORS/CSRF, чтобы будущие обращения из браузера не отбивались.
const siteURL = process.env.PUBLIC_SITE_URL || 'http://localhost:4321'

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' · Общество изучения традиционного тайцзицюань',
    },
    components: {
      // Кнопка «Опубликовать на сайте» под навигацией админки: сайт статический,
      // изменения выезжают следующей сборкой.
      beforeNavLinks: ['/components/RebuildButton#RebuildButton'],
    },
  },

  // Порядок групп в боковом меню админки задаётся полем admin.group у коллекций:
  // «Контент» → «Общество» → «Тайцзицюань» → «Файлы» → «Служебное».
  collections: [
    News,
    Events,
    Videos,
    Research,
    Team,
    Partners,
    Persons,
    TaijiSources,
    Media,
    Documents,
    Users,
  ],

  globals: [Home, AboutBlock, SocietyPage, ContactsPage, Navigation, SiteSettings],

  // POST /api/rebuild-site — ручной запуск пересборки сайта из админки.
  endpoints: [rebuildEndpoint],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),

  i18n: {
    supportedLanguages: { ru },
    fallbackLanguage: 'ru',
  },

  cors: [siteURL, serverURL],
  csrf: [siteURL, serverURL],

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  sharp,
})
