import type { Block, CollectionConfig } from 'payload'

import { slugField } from '../fields/slug'

// Блоки тела статьи повторяют объединение Block во фронтенде (apps/web) один в один:
// p / h2 / list / image / quote / video / html. Благодаря этому ArticleBody.astro
// остаётся без изменений — маппер лишь переименовывает поля.

const Paragraph: Block = {
  slug: 'paragraph',
  labels: { singular: 'Абзац', plural: 'Абзацы' },
  fields: [
    { name: 'text', type: 'textarea', label: 'Текст', required: true },
    {
      name: 'lead',
      type: 'checkbox',
      label: 'Лид (крупный первый абзац)',
      defaultValue: false,
    },
  ],
}

const Heading: Block = {
  slug: 'heading',
  labels: { singular: 'Подзаголовок', plural: 'Подзаголовки' },
  fields: [{ name: 'text', type: 'text', label: 'Текст', required: true }],
}

const List: Block = {
  slug: 'list',
  labels: { singular: 'Список', plural: 'Списки' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Пункты',
      minRows: 1,
      labels: { singular: 'Пункт', plural: 'Пункты' },
      fields: [{ name: 'text', type: 'textarea', label: 'Текст', required: true }],
    },
  ],
}

const ImageBlock: Block = {
  slug: 'image',
  labels: { singular: 'Изображение', plural: 'Изображения' },
  fields: [
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Файл', required: true },
    {
      name: 'alt',
      type: 'text',
      label: 'Альтернативный текст',
      admin: { description: 'Если пусто — возьмётся из карточки файла.' },
    },
    { name: 'caption', type: 'text', label: 'Подпись под фотографией' },
  ],
}

const Quote: Block = {
  slug: 'quote',
  labels: { singular: 'Цитата', plural: 'Цитаты' },
  fields: [{ name: 'text', type: 'textarea', label: 'Текст цитаты', required: true }],
}

const Video: Block = {
  slug: 'video',
  labels: { singular: 'Видео', plural: 'Видео' },
  fields: [
    {
      name: 'embed',
      type: 'text',
      label: 'Ссылка на встраивание RuTube',
      required: true,
      admin: { description: 'Вида https://rutube.ru/play/embed/<код>' },
    },
    { name: 'title', type: 'text', label: 'Название ролика' },
  ],
}

const Html: Block = {
  slug: 'html',
  labels: { singular: 'HTML-код', plural: 'HTML-код' },
  fields: [
    {
      name: 'html',
      type: 'code',
      label: 'Разметка',
      required: true,
      admin: {
        language: 'html',
        description:
          'Вставляется в статью как есть — виджеты, таблицы, карты, iframe. Код никак не проверяется: ' +
          'ошибка в разметке может поехать по вёрстке страницы. Вставки со <script> оживают только после ' +
          'полной перезагрузки страницы.',
      },
    },
  ],
}

// Оценка времени чтения по объёму текста статьи (~180 слов в минуту).
const countWords = (body: unknown): number => {
  if (!Array.isArray(body)) return 0
  let words = 0
  for (const block of body) {
    const b = block as Record<string, unknown>
    if (typeof b.text === 'string') words += b.text.split(/\s+/).filter(Boolean).length
    if (Array.isArray(b.items)) {
      for (const item of b.items) {
        const text = (item as Record<string, unknown>)?.text
        if (typeof text === 'string') words += text.split(/\s+/).filter(Boolean).length
      }
    }
  }
  return words
}

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Новость', plural: 'Новости' },
  admin: {
    group: 'Контент',
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', '_status', 'updatedAt'],
    description: 'Лента /news и страницы отдельных материалов.',
    preview: (doc) =>
      doc?.slug ? `${process.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/news/${doc.slug}` : null,
  },
  access: { read: () => true },
  versions: { drafts: true },
  defaultSort: '-date',
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Время чтения считаем сами, если редактор не задал своё.
        if (!data.readingTime) {
          const minutes = Math.max(1, Math.round(countWords(data.body) / 180))
          data.readingTime = `${minutes} мин`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
      required: true,
      admin: { description: 'Полный заголовок — h1 статьи и заголовок карточки в ленте.' },
    },
    {
      name: 'shortTitle',
      type: 'text',
      label: 'Короткий заголовок',
      admin: { description: 'Для хлебных крошек. Если пусто — возьмётся полный.' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Лид (анонс)',
      required: true,
      admin: { description: 'Показывается в ленте и в описании при репосте. 1–3 предложения.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Главное фото',
      admin: { description: 'Шапка статьи и обложка карточки. Без фото блок просто не выводится.' },
    },
    {
      name: 'imageAlt',
      type: 'text',
      label: 'Альтернативный текст главного фото',
      admin: { description: 'Необязательно — по умолчанию берётся из карточки файла.' },
    },
    {
      name: 'body',
      type: 'blocks',
      label: 'Тело статьи',
      labels: { singular: 'Блок', plural: 'Блоки' },
      blocks: [Paragraph, Heading, List, ImageBlock, Quote, Video, Html],
    },
    {
      name: 'author',
      type: 'group',
      label: 'Автор',
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Имя / организация',
          defaultValue: 'Общество изучения традиционного тайцзицюань',
        },
        { name: 'role', type: 'text', label: 'Должность' },
      ],
    },

    // --- Сайдбар ---
    {
      name: 'date',
      type: 'date',
      label: 'Дата публикации',
      required: true,
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
    slugField('title'),
    {
      name: 'readingTime',
      type: 'text',
      label: 'Время чтения',
      admin: {
        position: 'sidebar',
        description: 'Оставьте пустым — посчитается по объёму текста.',
      },
    },
    {
      name: 'isConference',
      type: 'checkbox',
      label: 'Материал первой конференции',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Такие материалы собираются в хабе конференции на странице «Исследования».',
      },
    },
  ],
}
