import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from 'payload'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const staticDir = process.env.DOCUMENTS_DIR || path.resolve(dirname, '../../media/documents')

// PDF-документы Общества (устав, положения) — блок «Документы» на /society.
// Размер файла берёт сайт из filesize, поэтому вручную его писать не нужно.
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Документ', plural: 'Документы' },
  admin: {
    group: 'Файлы',
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'updatedAt'],
  },
  access: { read: () => true },
  upload: {
    staticDir,
    mimeTypes: ['application/pdf'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Название',
      required: true,
      admin: { description: 'Как называется документ на сайте.' },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'Подпись',
      admin: { description: 'Строка под названием: например «Принят на учредительном собрании 04.03.2024 г.»' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Меньше — выше в списке.' },
    },
  ],
}
