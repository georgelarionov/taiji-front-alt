// Материалы раздела «Исследования». Потребители: страница /research (блоки
// «Источники»/«Публикации») и слайдер-тизер на главной.

import { fetchCollection } from './client'

export type ResearchKind = 'Источник' | 'Публикация'

export interface ResearchItem {
  kind: ResearchKind
  year?: string
  title: string
  desc: string
  label: string
  url: string
}

const KIND: Record<string, ResearchKind> = {
  source: 'Источник',
  publication: 'Публикация',
}

let cache: Promise<ResearchItem[]> | undefined

function getAll(): Promise<ResearchItem[]> {
  cache ||= fetchCollection<any>('research', { sort: 'order' }).then((docs) =>
    docs.map((doc) => ({
      kind: KIND[doc.kind] || 'Источник',
      year: doc.year || undefined,
      title: doc.title,
      desc: doc.desc,
      label: doc.label,
      url: doc.url,
    })),
  )
  return cache
}

export const getResearchAll = getAll

export async function getSources(): Promise<ResearchItem[]> {
  return (await getAll()).filter((item) => item.kind === 'Источник')
}

export async function getPublications(): Promise<ResearchItem[]> {
  return (await getAll()).filter((item) => item.kind === 'Публикация')
}
