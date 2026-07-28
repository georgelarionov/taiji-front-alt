import type { GlobalConfig } from 'payload'

// Навигация сайта: колонки полноэкранного меню и подвала, крупные ссылки и
// горизонтальное меню в шапке. Раньше лежало в src/config/nav.ts.
export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Навигация',
  admin: {
    group: 'Настройки',
    description: 'Меню, подвал и верхняя строка ссылок.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'columns',
      type: 'array',
      label: 'Колонки меню',
      labels: { singular: 'Колонка', plural: 'Колонки' },
      fields: [
        { name: 'title', type: 'text', label: 'Заголовок колонки', required: true },
        { name: 'href', type: 'text', label: 'Ссылка заголовка', required: true },
        {
          name: 'links',
          type: 'array',
          label: 'Пункты',
          labels: { singular: 'Пункт', plural: 'Пункты' },
          fields: [
            { name: 'label', type: 'text', label: 'Название', required: true },
            {
              name: 'href',
              type: 'text',
              label: 'Адрес',
              required: true,
              admin: { description: 'Можно якорь: /society#team' },
            },
          ],
        },
      ],
    },
    {
      name: 'bigLinks',
      type: 'array',
      label: 'Крупные ссылки',
      labels: { singular: 'Ссылка', plural: 'Ссылки' },
      admin: { description: 'Отдельный блок в меню и подвале.' },
      fields: [
        { name: 'label', type: 'text', label: 'Название', required: true },
        { name: 'href', type: 'text', label: 'Адрес', required: true },
      ],
    },
    {
      name: 'topNav',
      type: 'array',
      label: 'Меню в шапке',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      admin: { description: 'Горизонтальная строка на десктопе. Подсветка активного пункта — по адресу.' },
      fields: [
        { name: 'label', type: 'text', label: 'Название', required: true },
        { name: 'href', type: 'text', label: 'Адрес', required: true },
      ],
    },
  ],
}
