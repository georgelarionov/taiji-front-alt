import type { GlobalConfig } from 'payload'

// Сквозные данные сайта: контакты в плашке под первым экраном, подвал, страница
// контактов. Меняются в одном месте — обновляются везде.
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: {
    group: 'Настройки',
    description: 'Контакты и подписи, которые повторяются на всех страницах.',
  },
  access: { read: () => true },
  fields: [
    {
      type: 'collapsible',
      label: 'Контакты',
      fields: [
        { name: 'phone', type: 'text', label: 'Телефон', required: true },
        {
          name: 'phoneHref',
          type: 'text',
          label: 'Телефон для ссылки',
          required: true,
          admin: { description: 'В формате +79037479367 — подставляется в tel:' },
        },
        { name: 'email', type: 'text', label: 'E-mail', required: true },
        { name: 'address', type: 'textarea', label: 'Адрес' },
        { name: 'workingHours', type: 'text', label: 'Время работы' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Академическая поддержка',
      fields: [
        {
          name: 'supportLine1',
          type: 'text',
          label: 'Первая строка',
          defaultValue: 'При академической поддержке',
        },
        {
          name: 'supportLine2',
          type: 'text',
          label: 'Вторая строка',
          defaultValue: 'Института Китая и современной Азии РАН',
        },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      label: 'Социальные сети',
      labels: { singular: 'Сеть', plural: 'Сети' },
      admin: { description: 'Порядок здесь = порядок кнопок в меню и подвале.' },
      fields: [
        {
          // Не `id`: в Postgres так называется служебный ключ строки массива —
          // Payload попытается записать «telegram» в integer-колонку и упадёт.
          name: 'network',
          type: 'select',
          label: 'Сеть',
          required: true,
          options: [
            { label: 'Мессенджер (MAX)', value: 'messenger' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'ВКонтакте', value: 'vk' },
          ],
          admin: { description: 'Определяет, какая иконка подставится.' },
        },
        { name: 'alt', type: 'text', label: 'Подпись', required: true },
        {
          name: 'href',
          type: 'text',
          label: 'Ссылка',
          required: true,
          admin: { description: 'Пока ссылки нет — поставьте #' },
        },
      ],
    },
    {
      name: 'mapEmbed',
      type: 'text',
      label: 'Карта Яндекса',
      admin: {
        description: 'Ссылка на встраивание конструктора карт — показывается на странице контактов.',
      },
    },
  ],
}
