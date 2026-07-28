import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Каталог файлов. На Railway это примонтированный том (MEDIA_DIR=/data/media),
// локально — apps/cms/media. Файлы отдаются по /api/media/file/<имя>; сборка сайта
// берёт ОРИГИНАЛ и сама гонит его через <Image> — размеры ниже нужны админке и
// возможному рантайм-рендеру.
const staticDir = process.env.MEDIA_DIR || path.resolve(dirname, '../../media')

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Изображение', plural: 'Медиафайлы' },
  admin: {
    group: 'Файлы',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    description: 'Фотографии новостей, портреты, логотипы и иллюстрации.',
  },
  access: { read: () => true },
  upload: {
    staticDir,
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 1328, height: undefined, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Альтернативный текст',
      required: true,
      admin: {
        description:
          'Что изображено — читают скринридеры и поисковики. Например: «Участники конференции в зале ИКСА РАН».',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
      admin: { description: 'Необязательно. Показывается под фотографией.' },
    },
    {
      name: 'credit',
      type: 'text',
      label: 'Источник / лицензия',
      admin: { description: 'Для фотографий с обязательной атрибуцией (CC-BY и подобные).' },
    },
  ],
}
