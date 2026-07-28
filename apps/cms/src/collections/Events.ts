import type { CollectionConfig } from 'payload'

// Анонсы (/events). До появления CMS страница была заглушкой — теперь наполняется отсюда.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Анонс', plural: 'Анонсы' },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'status'],
    description: 'Предстоящие и прошедшие события Общества.',
  },
  access: { read: () => true },
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    {
      name: 'desc',
      type: 'textarea',
      label: 'Описание',
      required: true,
    },
    { name: 'place', type: 'text', label: 'Место проведения' },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Изображение',
    },
    {
      name: 'url',
      type: 'text',
      label: 'Ссылка',
      admin: { description: 'Регистрация или страница события. Необязательно.' },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Дата проведения',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      required: true,
      defaultValue: 'upcoming',
      options: [
        { label: 'Предстоящее', value: 'upcoming' },
        { label: 'Прошедшее', value: 'past' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
