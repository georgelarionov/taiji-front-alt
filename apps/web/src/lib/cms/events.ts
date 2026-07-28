// Анонсы (/events). Раньше страница была заглушкой — теперь наполняется из CMS.

import { fetchCollection, formatRuDate, toImage, type CmsImage } from './client'

export interface SiteEvent {
  id: string
  date: string
  title: string
  desc: string
  place?: string
  url?: string
  status: 'upcoming' | 'past'
  image?: CmsImage
}

export async function getEvents(): Promise<SiteEvent[]> {
  const docs = await fetchCollection<any>('events', { sort: '-date' })
  return docs.map((doc) => ({
    id: String(doc.id),
    date: formatRuDate(doc.date),
    title: doc.title,
    desc: doc.desc,
    place: doc.place || undefined,
    url: doc.url || undefined,
    status: doc.status === 'past' ? 'past' : 'upcoming',
    image: toImage(doc.image, doc.title),
  }))
}
