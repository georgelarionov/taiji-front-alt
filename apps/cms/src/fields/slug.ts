import type { Field } from 'payload'

import { slugify } from '../lib/slugify'

// Поле слага для коллекций с собственными адресами (новости, видео).
// Пустое поле заполняется транслитерацией заголовка при сохранении; заполненное
// не трогаем — адреса опубликованных материалов должны быть стабильными.
export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  type: 'text',
  label: 'Слаг (адрес)',
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'Латиницей. Оставьте пустым — соберётся из заголовка.',
  },
  hooks: {
    beforeValidate: [
      ({ value, data }) => {
        if (typeof value === 'string' && value.trim()) return slugify(value)
        const source = data?.[from]
        return typeof source === 'string' && source ? slugify(source) : value
      },
    ],
  },
})
