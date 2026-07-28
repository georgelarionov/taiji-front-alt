import type { GlobalConfig } from 'payload'

// Тексты страницы /contacts. Сами контакты (телефон, почта, адрес, карта) —
// в «Настройках сайта», чтобы не расходились с плашкой и подвалом.
export const ContactsPage: GlobalConfig = {
  slug: 'contacts-page',
  label: 'Страница «Контакты»',
  admin: {
    group: 'Страницы',
    description: 'Телефон, почта и карта берутся из «Настроек сайта».',
  },
  access: { read: () => true },
  fields: [
    { name: 'heading', type: 'text', label: 'Заголовок', defaultValue: 'Контакты' },
    { name: 'intro', type: 'textarea', label: 'Вступительный текст' },
    {
      name: 'ctaTitle',
      type: 'text',
      label: 'Заголовок блока обратной связи',
      defaultValue: 'Отправить сообщение',
    },
    {
      name: 'ctaText',
      type: 'textarea',
      label: 'Текст блока обратной связи',
    },
  ],
}
