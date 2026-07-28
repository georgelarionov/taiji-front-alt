// Данные страницы /society: правление, документы, партнёры, тексты миссии.

import { fetchCollection, fetchGlobal, toImage, type CmsImage } from './client'

// Пункт биографии: абзац либо абзац с вложенным списком.
export type HistoryEntry = string | { text: string; items: string[] }

export interface TeamBio {
  id: string
  role: string
  name: string
  photo?: CmsImage
  description: string[]
  history: HistoryEntry[]
}

export interface SocietyDocument {
  title: string
  subtitle: string
  href: string
  sizeMb: string
}

export interface Partner {
  name: string
  logo?: CmsImage
  url?: string
}

export interface SocietyContent {
  heroTitle: string
  heroSubtitle?: string
  missionHeading: string
  missionParagraphs: string[]
  values: { title: string; description: string }[]
}

export async function getTeam(): Promise<TeamBio[]> {
  const docs = await fetchCollection<any>('team', { sort: 'order' })
  return docs.map((doc) => ({
    id: String(doc.id),
    role: doc.role,
    name: doc.name,
    photo: toImage(doc.portrait, `${doc.name} — ${doc.role}`),
    description: (doc.description || []).map((d: any) => d.text),
    history: (doc.history || []).map((entry: any) =>
      entry.items?.length
        ? { text: entry.text, items: entry.items.map((i: any) => i.text) }
        : entry.text,
    ),
  }))
}

export async function getDocuments(): Promise<SocietyDocument[]> {
  const docs = await fetchCollection<any>('documents', { sort: 'order' })
  return docs.map((doc) => ({
    title: doc.title,
    subtitle: doc.subtitle || '',
    href: doc.url,
    // Payload отдаёт размер в байтах. Мегабайты десятичные (как показывает ОС),
    // один знак после запятой, хвостовой «.0» убираем — формат сохраняем прежний.
    sizeMb: doc.filesize ? (doc.filesize / 1e6).toFixed(1).replace(/\.0$/, '') : '',
  }))
}

export async function getPartners(): Promise<Partner[]> {
  const docs = await fetchCollection<any>('partners', { sort: 'order' })
  return docs.map((doc) => ({
    name: doc.name,
    logo: toImage(doc.logo, doc.name),
    url: doc.url || undefined,
  }))
}

export async function getSocietyContent(): Promise<SocietyContent> {
  const global = await fetchGlobal<any>('society-page')
  return {
    heroTitle: global.heroTitle || '',
    heroSubtitle: global.heroSubtitle || undefined,
    missionHeading: global.missionHeading || 'Миссии и ценности',
    missionParagraphs: (global.missionParagraphs || []).map((p: any) => p.text),
    values: (global.values || []).map((v: any) => ({ title: v.title, description: v.description })),
  }
}
