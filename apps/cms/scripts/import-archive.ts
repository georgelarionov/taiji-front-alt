// Разовый импорт архива новостей со старого сайта в Payload.
// Данные — final.json (см. scratchpad/parse.py + fix.py), фото — папка photos/.
// Идемпотентен по слагу статьи и имени файла.
//
// Запуск из apps/cms:
//   ARCHIVE_JSON=<путь>/final.json ARCHIVE_PHOTOS=<путь>/photos \
//   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node scripts/import-archive.ts

import 'dotenv/config'

import fs from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../src/payload.config'

type Block =
  | { type: 'p'; text: string; lead?: boolean }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; file: string; alt: string }
  | { type: 'video'; embed: string }

type Article = {
  slug: string
  date: string
  title: string
  shortTitle: string
  excerpt: string
  author: string
  cover: { file: string; alt: string } | null
  blocks: Block[]
}

const JSON_PATH = process.env.ARCHIVE_JSON as string
const PHOTOS_DIR = process.env.ARCHIVE_PHOTOS as string

const MONTHS: Record<string, number> = {
  января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
  июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
}

function parseRuDate(input: string): string {
  const m = input.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i)
  if (!m) throw new Error(`Не разобрал дату: «${input}»`)
  const month = MONTHS[m[2].toLowerCase()]
  if (month === undefined) throw new Error(`Неизвестный месяц: «${input}»`)
  return new Date(Date.UTC(Number(m[3]), month, Number(m[1]), 12)).toISOString()
}

const payload = await getPayload({ config })
const articles: Article[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))

const cache = new Map<string, number>()
let uploaded = 0

async function mediaId(file: string, alt: string): Promise<number> {
  if (cache.has(file)) return cache.get(file)!

  const filePath = path.join(PHOTOS_DIR, file)
  if (!fs.existsSync(filePath)) throw new Error(`Нет файла: ${filePath}`)
  const size = fs.statSync(filePath).size

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: file } },
    limit: 1,
    pagination: false,
  })
  if (existing.docs.length) {
    // Совпадения имени мало — под ним может лежать чужой файл (в media уже есть
    // обезличенные `1.jpg` и т.п.), и статья молча получит не ту фотографию.
    if (existing.docs[0].filesize !== size) {
      throw new Error(`Имя ${file} занято другим файлом (media #${existing.docs[0].id}) — переименуйте фото.`)
    }
    cache.set(file, existing.docs[0].id as number)
    return existing.docs[0].id as number
  }

  const created = await payload.create({ collection: 'media', data: { alt }, filePath })
  uploaded += 1
  cache.set(file, created.id as number)
  return created.id as number
}

for (const article of articles) {
  const body: Record<string, unknown>[] = []
  for (const b of article.blocks) {
    switch (b.type) {
      case 'p':
        body.push({ blockType: 'paragraph', text: b.text, lead: Boolean(b.lead) })
        break
      case 'h2':
        body.push({ blockType: 'heading', text: b.text })
        break
      case 'list':
        body.push({ blockType: 'list', items: b.items.map((text) => ({ text })) })
        break
      case 'image':
        body.push({ blockType: 'image', image: await mediaId(b.file, b.alt), alt: b.alt })
        break
      case 'video':
        body.push({ blockType: 'video', embed: b.embed })
        break
    }
  }

  const doc = {
    slug: article.slug,
    title: article.title,
    shortTitle: article.shortTitle,
    excerpt: article.excerpt,
    date: parseRuDate(article.date),
    image: article.cover ? await mediaId(article.cover.file, article.cover.alt) : undefined,
    imageAlt: article.cover?.alt,
    isConference: false,
    author: { name: article.author },
    body,
    _status: 'published',
  }

  const found = await payload.find({
    collection: 'news',
    where: { slug: { equals: article.slug } },
    limit: 1,
    pagination: false,
    draft: true,
  })

  if (found.docs.length) {
    await payload.update({ collection: 'news', id: found.docs[0].id, data: doc as never })
    console.log(`  ↻ ${article.slug}`)
  } else {
    await payload.create({ collection: 'news', data: doc as never })
    console.log(`  + ${article.slug}`)
  }
}

console.log(`\nГотово: статей ${articles.length}, новых файлов ${uploaded}.`)
process.exit(0)
