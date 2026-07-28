import type { GlobalConfig } from 'payload'

// Тексты страницы /society: блок «Миссии и ценности».
// Команда, документы и партнёры живут в своих коллекциях.
export const SocietyPage: GlobalConfig = {
  slug: 'society-page',
  label: 'Страница «Общество»',
  admin: {
    group: 'Страницы',
    description: 'Миссия и ценности. Состав команды и партнёров — в отдельных разделах.',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'heroTitle',
      type: 'text',
      label: 'Заголовок первого блока',
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
      label: 'Подзаголовок первого блока',
    },
    {
      name: 'missionHeading',
      type: 'text',
      label: 'Заголовок блока миссии',
      defaultValue: 'Миссии и ценности',
    },
    {
      name: 'missionParagraphs',
      type: 'array',
      label: 'Текст миссии',
      labels: { singular: 'Абзац', plural: 'Абзацы' },
      fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
    },
    {
      name: 'values',
      type: 'array',
      label: 'Ценности',
      labels: { singular: 'Ценность', plural: 'Ценности' },
      admin: { description: 'На десктопе — сетка, на мобильных — слайдер.' },
      fields: [
        { name: 'title', type: 'text', label: 'Название', required: true },
        { name: 'description', type: 'textarea', label: 'Описание', required: true },
      ],
    },
  ],
}
