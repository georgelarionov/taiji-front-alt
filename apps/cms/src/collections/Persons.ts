import type { CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

// Персоналии тайцзицюань (/taijiquan/person): карточка + панель «Подробнее»
// с биографией и списком источников.
export const Persons: CollectionConfig = {
  slug: 'persons',
  labels: { singular: 'Персоналия', plural: 'Персоналии тайцзицюань' },
  admin: {
    group: 'Тайцзицюань',
    useAsTitle: 'name',
    defaultColumns: ['name', 'line', 'order'],
  },
  access: { read: () => true },
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', label: 'Имя (по-русски)', required: true },
    {
      name: 'cjk',
      type: 'text',
      label: 'Иероглифическое написание',
      admin: { description: 'Выводится с пометкой языка — для корректного чтения скринридерами.' },
    },
    {
      name: 'line',
      type: 'text',
      label: 'Линия преемственности',
      required: true,
      admin: { description: 'Надзаголовок карточки: например «Стиль Чэнь».' },
    },
    {
      name: 'card',
      type: 'textarea',
      label: 'Текст карточки',
      required: true,
      admin: { description: 'Пара предложений — что показать в сетке персоналий.' },
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      label: 'Портрет',
      admin: { description: 'Только изображения в общественном достоянии или под свободной лицензией.' },
    },
    {
      name: 'meta',
      type: 'array',
      label: 'Краткие сведения',
      labels: { singular: 'Строка', plural: 'Строки' },
      admin: { description: 'Пары «ярлык — значение»: линия, годы жизни, ключевое значение.' },
      fields: [
        { name: 'label', type: 'text', label: 'Ярлык', required: true },
        { name: 'value', type: 'text', label: 'Значение', required: true },
      ],
    },
    {
      name: 'bio',
      type: 'array',
      label: 'Биография',
      labels: { singular: 'Абзац', plural: 'Абзацы' },
      fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
    },
    {
      name: 'sources',
      type: 'relationship',
      relationTo: 'taiji-sources',
      hasMany: true,
      label: 'Источники',
      admin: { description: 'Показываются в панели «Подробнее» этой персоналии.' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Меньше — выше в сетке.' },
    },
    // Якорь человека на сайте: по ссылке <страница>#<слаг> сразу открывается его панель.
    slugField(
      'name',
      'Адрес человека на сайте: /taijiquan/person#<слаг> — эту ссылку можно ставить в тексты новостей. ' +
        'Китайские имена — пиньинем: yang-luchan. Пустое поле соберётся транслитом (yan-luchan).',
    ),
  ],
}
