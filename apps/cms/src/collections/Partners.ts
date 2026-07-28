import type { CollectionConfig } from 'payload'

// Партнёры Общества — блок «Партнёры» на /society.
export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: { singular: 'Партнёр', plural: 'Партнёры' },
  admin: {
    group: 'Общество',
    useAsTitle: 'name',
    defaultColumns: ['name', 'url', 'order'],
  },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Название', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Логотип' },
    { name: 'url', type: 'text', label: 'Сайт партнёра' },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Меньше — выше в списке.' },
    },
  ],
}
