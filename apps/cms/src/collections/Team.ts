import type { CollectionConfig } from 'payload'

// Правление Общества — блок «Команда» на /society: карточка (роль + имя + портрет)
// и выезжающая панель «Подробнее» (описание + биография).
export const Team: CollectionConfig = {
  slug: 'team',
  labels: { singular: 'Член правления', plural: 'Команда Общества' },
  admin: {
    group: 'Общество',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'order'],
    description: 'Порядок карточек задаётся полем «Порядок».',
  },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'ФИО', required: true },
    { name: 'role', type: 'text', label: 'Должность в Обществе', required: true },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      label: 'Портрет',
    },
    {
      name: 'description',
      type: 'array',
      label: 'Описание',
      labels: { singular: 'Абзац', plural: 'Абзацы' },
      admin: { description: 'Короткое вступление перед биографией.' },
      fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
    },
    {
      name: 'history',
      type: 'array',
      label: 'Биография',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      fields: [
        { name: 'text', type: 'textarea', label: 'Текст', required: true },
        {
          name: 'items',
          type: 'array',
          label: 'Вложенный список',
          labels: { singular: 'Пункт', plural: 'Пункты' },
          admin: { description: 'Нужен редко — например для перечисления текущих должностей.' },
          fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
        },
      ],
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Меньше — выше. Председатели идут первыми.' },
    },
  ],
}
