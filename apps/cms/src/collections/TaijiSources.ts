import type { CollectionConfig } from 'payload'

// Общий пронумерованный список источников для персоналий тайцзицюань.
// Нумерация сквозная: на неё ссылаются сноски в биографиях.
export const TaijiSources: CollectionConfig = {
  slug: 'taiji-sources',
  labels: { singular: 'Источник', plural: 'Источники персоналий' },
  admin: {
    group: 'Тайцзицюань',
    useAsTitle: 'title',
    defaultColumns: ['n', 'title', 'label'],
    description: 'Показываются внутри панели «Подробнее» у каждой персоналии.',
  },
  access: { read: () => true },
  defaultSort: 'n',
  fields: [
    {
      name: 'n',
      type: 'number',
      label: 'Номер',
      required: true,
      unique: true,
      admin: { position: 'sidebar', description: 'Сквозная нумерация сносок.' },
    },
    { name: 'title', type: 'text', label: 'Название', required: true },
    { name: 'desc', type: 'textarea', label: 'Пояснение', required: true },
    {
      name: 'url',
      type: 'text',
      label: 'Ссылка',
      admin: { description: 'Если источник только печатный — оставьте пустым.' },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Подпись ссылки',
      admin: { description: 'Обычно домен: например unesco.org' },
    },
  ],
}
