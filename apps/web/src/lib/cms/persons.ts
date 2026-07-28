// Персоналии тайцзицюань (/taijiquan/person) и их источники.
// Источники хранятся отдельной коллекцией со сквозной нумерацией — сноски в
// биографиях ссылаются на неё, поэтому нумерация должна пережить редактирование.

import { fetchCollection, toImage, type CmsImage } from './client'

export type PersonSource = {
  n: number
  title: string
  desc: string
  url: string | null
  label: string | null
}

export type PersonMeta = { label: string; value: string }

export type TaijiPerson = {
  id: string
  name: string
  cjk: string
  line: string
  card: string
  portrait?: CmsImage
  meta: PersonMeta[]
  bio: string[]
  sourceNs: number[]
}

export async function getPersonSources(): Promise<PersonSource[]> {
  const docs = await fetchCollection<any>('taiji-sources', { sort: 'n' })
  return docs.map((doc) => ({
    n: doc.n,
    title: doc.title,
    desc: doc.desc,
    url: doc.url || null,
    label: doc.label || null,
  }))
}

export async function getPersons(): Promise<TaijiPerson[]> {
  const docs = await fetchCollection<any>('persons', { sort: 'order' })
  return docs.map((doc) => ({
    id: String(doc.id),
    name: doc.name,
    cjk: doc.cjk || '',
    line: doc.line,
    card: doc.card,
    portrait: toImage(doc.portrait, doc.name),
    meta: (doc.meta || []).map((m: any) => ({ label: m.label, value: m.value })),
    bio: (doc.bio || []).map((b: any) => b.text),
    // depth=1 разворачивает связь в объекты; если пришли голые id — берём их.
    sourceNs: (doc.sources || [])
      .map((s: any) => (typeof s === 'object' ? s.n : undefined))
      .filter((n: unknown): n is number => typeof n === 'number'),
  }))
}
