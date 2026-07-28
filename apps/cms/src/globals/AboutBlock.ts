import type { GlobalConfig } from 'payload'

// Блок «О тайцзицюань» на главной — заголовок и четыре карточки разделов.
export const AboutBlock: GlobalConfig = {
  slug: 'about-block',
  label: 'Блок «О тайцзицюань»',
  admin: {
    group: 'Страницы',
    description: 'Сетка 2×2 на главной, ведёт в разделы /taijiquan/*.',
  },
  access: { read: () => true },
  fields: [
    { name: 'heading', type: 'text', label: 'Заголовок', required: true, defaultValue: 'О тайцзицюань' },
    { name: 'subtitle', type: 'text', label: 'Подзаголовок' },
    {
      name: 'cards',
      type: 'array',
      label: 'Карточки разделов',
      labels: { singular: 'Карточка', plural: 'Карточки' },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок', required: true },
        { name: 'desc', type: 'textarea', label: 'Описание', required: true },
        { name: 'href', type: 'text', label: 'Куда ведёт', required: true },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Изображение',
        },
      ],
    },
  ],
}
