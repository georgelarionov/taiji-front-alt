import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

// Видео медиа-архива (/media-archive). Один материал может состоять из нескольких
// роликов — например запись конференции, разбитая на части.
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: { singular: 'Видео', plural: 'Видео (медиа-архив)' },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'updatedAt'],
    description: 'Вкладка «Видео» на странице «Медиа-архив».',
  },
  access: { read: () => true },
  defaultSort: '-date',
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    {
      name: 'desc',
      type: 'array',
      label: 'Описание',
      labels: { singular: 'Абзац', plural: 'Абзацы' },
      admin: { description: 'В карточке видно первый абзац, в выезжающей панели — все.' },
      fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
    },
    {
      name: 'embeds',
      type: 'array',
      label: 'Ролики',
      minRows: 1,
      labels: { singular: 'Ролик', plural: 'Ролики' },
      fields: [
        {
          name: 'src',
          type: 'text',
          label: 'Ссылка на встраивание RuTube',
          required: true,
          admin: { description: 'Вида https://rutube.ru/play/embed/<код>' },
        },
        {
          name: 'label',
          type: 'text',
          label: 'Подпись части',
          admin: { description: 'Нужна, только если роликов несколько: «Часть 1» и так далее.' },
        },
      ],
    },
    {
      name: 'date',
      type: 'date',
      label: 'Дата',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
    slugField('title'),
  ],
}
