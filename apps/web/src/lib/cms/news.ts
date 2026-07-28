// Новости из CMS. Формы типов намеренно повторяют прежний src/data/news.ts —
// компоненты ленты и страницы статьи менять почти не пришлось. Отличие одно:
// картинка теперь не ImageMetadata (локальный импорт), а CmsImage (удалённый файл
// Payload) — её рендерит <CmsPicture>.

import { fetchCollection, formatRuDate, toImage, type CmsImage } from './client'

export interface NewsAuthor {
  name: string
  role?: string
}

// Блоки тела статьи. Дискриминанты те же, что были в коде, — ArticleBody.astro
// разбирает их без изменений.
export type Block =
  | { type: 'p'; text: string; lead?: boolean }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; src: CmsImage; alt: string; caption?: string }
  | { type: 'quote'; text: string }
  | { type: 'video'; embed: string; title?: string }

export interface NewsArticle {
  slug: string
  date: string
  title: string
  shortTitle: string
  excerpt: string
  readingTime: string
  image?: CmsImage
  imageAlt?: string
  body: Block[]
  author?: NewsAuthor
  isConference: boolean
}

export const SOCIETY_AUTHOR: NewsAuthor = {
  name: 'Общество изучения традиционного тайцзицюань',
}

function toBlocks(raw: any[]): Block[] {
  const blocks: Block[] = []

  for (const block of raw || []) {
    switch (block.blockType) {
      case 'paragraph':
        blocks.push({ type: 'p', text: block.text, lead: Boolean(block.lead) })
        break
      case 'heading':
        blocks.push({ type: 'h2', text: block.text })
        break
      case 'list':
        blocks.push({ type: 'list', items: (block.items || []).map((i: any) => i.text) })
        break
      case 'image': {
        const src = toImage(block.image, block.alt)
        // Блок без картинки (файл удалили) просто пропускаем — верстать нечего.
        if (src) blocks.push({ type: 'image', src, alt: src.alt, caption: block.caption || undefined })
        break
      }
      case 'quote':
        blocks.push({ type: 'quote', text: block.text })
        break
      case 'video':
        blocks.push({ type: 'video', embed: block.embed, title: block.title || undefined })
        break
    }
  }

  return blocks
}

function toArticle(doc: any): NewsArticle {
  return {
    slug: doc.slug,
    date: formatRuDate(doc.date),
    title: doc.title,
    shortTitle: doc.shortTitle || doc.title,
    excerpt: doc.excerpt,
    readingTime: doc.readingTime || '',
    image: toImage(doc.image, doc.imageAlt),
    imageAlt: doc.imageAlt || undefined,
    body: toBlocks(doc.body),
    author: doc.author?.name ? { name: doc.author.name, role: doc.author.role || undefined } : SOCIETY_AUTHOR,
    isConference: Boolean(doc.isConference),
  }
}

// Один запрос на сборку — дальше все потребители читают из этого промиса.
let cache: Promise<NewsArticle[]> | undefined

export function getArticles(): Promise<NewsArticle[]> {
  cache ||= fetchCollection<any>('news', { sort: '-date' }).then((docs) => docs.map(toArticle))
  return cache
}

export async function getArticle(slug: string): Promise<NewsArticle | undefined> {
  return (await getArticles()).find((a) => a.slug === slug)
}

/** «Другие новости» для страницы статьи. */
export async function getRelatedArticles(slug: string, n = 6): Promise<NewsArticle[]> {
  return (await getArticles()).filter((a) => a.slug !== slug).slice(0, n)
}

/** Материалы первой конференции — хаб на /research. */
export async function getConferenceArticles(): Promise<NewsArticle[]> {
  return (await getArticles()).filter((a) => a.isConference)
}
