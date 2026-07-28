import type { CollectionConfig } from 'payload'

// Материалы раздела «Исследования»: классические трактаты и научные публикации.
// Все карточки — внешние ссылки на оригиналы.
export const Research: CollectionConfig = {
  slug: 'research',
  labels: { singular: 'Материал', plural: 'Исследования' },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'kind', 'year'],
    description: 'Блоки «Источники» и «Публикации» на странице /research.',
  },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', label: 'Название', required: true },
    {
      name: 'desc',
      type: 'textarea',
      label: 'Описание',
      required: true,
      admin: { description: 'О чём материал — 1–2 предложения.' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'Ссылка на оригинал',
      required: true,
      admin: { description: 'Открывается в новой вкладке.' },
    },
    {
      name: 'label',
      type: 'text',
      label: 'Подпись ссылки',
      required: true,
      admin: { description: 'Обычно домен источника: например shiyanbin.ru' },
    },
    {
      name: 'kind',
      type: 'select',
      label: 'Раздел',
      required: true,
      defaultValue: 'source',
      options: [
        { label: 'Источник', value: 'source' },
        { label: 'Публикация', value: 'publication' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'year',
      type: 'text',
      label: 'Год',
      admin: { position: 'sidebar', description: 'У классических трактатов года нет — оставьте пустым.' },
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
