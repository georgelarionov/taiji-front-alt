import type { GlobalConfig } from 'payload'

// Первый экран главной: две карточки-ссылки с тушевыми иллюстрациями.
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Главная страница',
  admin: {
    group: 'Страницы',
    description: 'Первый экран: карточки «Общество» и «Тайцзицюань».',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'cards',
      type: 'array',
      label: 'Карточки первого экрана',
      labels: { singular: 'Карточка', plural: 'Карточки' },
      minRows: 2,
      maxRows: 2,
      admin: { description: 'Ровно две — так собран макет первого экрана.' },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок', required: true },
        { name: 'description', type: 'textarea', label: 'Описание', required: true },
        {
          name: 'href',
          type: 'text',
          label: 'Куда ведёт',
          required: true,
          admin: { description: 'Внутренний адрес, например /society' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Иллюстрация',
          required: true,
          admin: { description: 'Пропорция 2:1 — иначе кроп съест края.' },
        },
        {
          name: 'imageAlt',
          type: 'text',
          label: 'Описание иллюстрации',
          admin: { description: 'Если пусто — возьмётся из карточки файла.' },
        },
      ],
    },
  ],
}
