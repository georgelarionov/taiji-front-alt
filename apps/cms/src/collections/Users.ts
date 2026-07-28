import type { CollectionConfig } from 'payload'

// Редакторы сайта. Первый пользователь создаётся через /admin при первом входе.
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Редактор', plural: 'Редакторы' },
  admin: {
    useAsTitle: 'name',
    group: 'Служебное',
    defaultColumns: ['name', 'email'],
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
      admin: { description: 'Показывается в правом верхнем углу админки.' },
    },
  ],
}
