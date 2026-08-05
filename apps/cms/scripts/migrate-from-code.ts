// Перенос контента сайта из кода (apps/web/src/data + тексты блоков) в Payload.
//
// Запуск:  pnpm --filter cms migrate:content
//
// Скрипт идемпотентен: ищет документ по слагу/имени и обновляет его, иначе создаёт.
// Гонять можно сколько угодно — дублей не будет.
//
// Тонкость: модули данных лежат в Astro-приложении и импортируют картинки
// (`import img from "../../assets/..."`), что вне Astro не исполняется. Поэтому
// сначала собираем их esbuild'ом с плагином, который подменяет импорт картинки на
// строку с абсолютным путём к файлу; путь потом идёт в filePath при загрузке в media.

import 'dotenv/config'

import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import * as esbuild from 'esbuild'
import { getPayload } from 'payload'

import config from '../src/payload.config'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../../..')
const webSrc = path.join(repoRoot, 'apps/web/src')
const dataDir = path.join(webSrc, 'data')

// ─────────────────────────── сборка данных сайта ───────────────────────────

const ASSET_RE = /\.(jpe?g|png|webp|avif|svg|gif)$/i

/** Собирает модули данных в один ESM-файл и возвращает его экспорты. */
async function loadWebData(): Promise<Record<string, any>> {
  const entry = `
    export { articles, CONFERENCE_2025_SLUGS } from ${JSON.stringify(path.join(dataDir, 'news.ts'))}
    export { videos } from ${JSON.stringify(path.join(dataDir, 'media.ts'))}
    export { sources, publications } from ${JSON.stringify(path.join(dataDir, 'research.ts'))}
    export { teamBios } from ${JSON.stringify(path.join(dataDir, 'society-team.ts'))}
    export { persons, personSources } from ${JSON.stringify(path.join(dataDir, 'taiji-persons.ts'))}
  `

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taiji-migrate-'))
  const outfile = path.join(outDir, 'data.mjs')

  await esbuild.build({
    stdin: { contents: entry, resolveDir: dataDir, loader: 'ts' },
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'node22',
    outfile,
    // Картинка → строка с абсолютным путём к файлу на диске.
    plugins: [
      {
        name: 'assets-as-paths',
        setup(build) {
          build.onResolve({ filter: ASSET_RE }, (args) => ({
            path: path.resolve(args.resolveDir, args.path),
            namespace: 'asset-path',
          }))
          build.onLoad({ filter: /.*/, namespace: 'asset-path' }, (args) => ({
            contents: `export default ${JSON.stringify(args.path)}`,
            loader: 'js',
          }))
        },
      },
    ],
  })

  const mod = await import(outfile)
  return mod
}

// ─────────────────────────────── утилиты ───────────────────────────────

const MONTHS: Record<string, number> = {
  января: 0, февраля: 1, марта: 2, апреля: 3, мая: 4, июня: 5,
  июля: 6, августа: 7, сентября: 8, октября: 9, ноября: 10, декабря: 11,
}

/** «3 июня 2026 г.» → ISO-строка. Дата на сайте хранится как настоящая дата. */
function parseRuDate(input: string): string {
  const m = input.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i)
  if (!m) {
    const fallback = new Date(input)
    if (!Number.isNaN(fallback.getTime())) return fallback.toISOString()
    throw new Error(`Не разобрал дату: «${input}»`)
  }
  const [, day, monthName, year] = m
  const month = MONTHS[monthName.toLowerCase()]
  if (month === undefined) throw new Error(`Неизвестный месяц в дате: «${input}»`)
  return new Date(Date.UTC(Number(year), month, Number(day), 12)).toISOString()
}

const strip = (items?: { text: string }[] | string[]) =>
  (items || []).map((i) => (typeof i === 'string' ? { text: i } : i))

// ─────────────────────────────── миграция ───────────────────────────────

const payload = await getPayload({ config })
const data = await loadWebData()

let uploaded = 0
const mediaCache = new Map<string, number>()

/** Ищет уже загруженный media с таким именем И таким же размером файла. */
async function findUploaded(filename: string, size: number): Promise<number | undefined> {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
  })
  const doc = existing.docs[0]
  return doc && doc.filesize === size ? (doc.id as number) : undefined
}

/** Загружает файл в media (или переиспользует уже загруженный — тот же файл). */
async function mediaId(filePath: string, alt: string): Promise<number | undefined> {
  if (!filePath) return undefined
  if (mediaCache.has(filePath)) return mediaCache.get(filePath)

  if (!fs.existsSync(filePath)) {
    console.warn(`  ! файла нет на диске: ${filePath}`)
    return undefined
  }

  // Имена ассетов уникальны только внутри папки статьи — у многих это просто `1.jpg`.
  // Совпадения имени мало: сверяем ещё и размер, иначе статья молча получит чужую
  // фотографию (так `1.jpg`/`2.jpg` ноябрьских новостей схлопнулись с файлами
  // первой конференции). Занято чужим файлом → грузим под именем с префиксом папки.
  const size = fs.statSync(filePath).size
  const filename = path.basename(filePath)
  const scoped = `${path.basename(path.dirname(filePath))}-${filename}`

  for (const name of [filename, scoped]) {
    const id = await findUploaded(name, size)
    if (id) {
      mediaCache.set(filePath, id)
      return id
    }
  }

  const taken = Boolean((await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    pagination: false,
  })).docs.length)

  let source = filePath
  if (taken) {
    source = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'taiji-media-')), scoped)
    fs.copyFileSync(filePath, source)
    console.warn(`  ~ имя ${filename} занято другим файлом → загружаю как ${scoped}`)
  }

  const created = await payload.create({
    collection: 'media',
    data: { alt: alt || filename },
    filePath: source,
  })
  uploaded += 1
  mediaCache.set(filePath, created.id as number)
  return created.id as number
}

/** Создаёт документ или обновляет существующий — сопоставление по полю `by`. */
async function upsert(collection: any, by: string, value: any, doc: Record<string, any>) {
  const found = await payload.find({
    collection,
    where: { [by]: { equals: value } },
    limit: 1,
    pagination: false,
    ...(collection === 'news' ? { draft: true } : {}),
  })

  if (found.docs.length) {
    return payload.update({ collection, id: found.docs[0].id, data: doc })
  }
  return payload.create({ collection, data: doc })
}

// ─── Новости ───────────────────────────────────────────────────────────

async function migrateNews() {
  const conferenceSlugs: string[] = data.CONFERENCE_2025_SLUGS || []
  console.log(`\n▸ Новости: ${data.articles.length}`)

  for (const article of data.articles) {
    const body = []
    for (const block of article.body) {
      switch (block.type) {
        case 'p':
          body.push({ blockType: 'paragraph', text: block.text, lead: Boolean(block.lead) })
          break
        case 'h2':
          body.push({ blockType: 'heading', text: block.text })
          break
        case 'list':
          body.push({ blockType: 'list', items: strip(block.items) })
          break
        case 'image':
          body.push({
            blockType: 'image',
            image: await mediaId(block.src, block.alt),
            alt: block.alt,
            caption: block.caption,
          })
          break
        case 'quote':
          body.push({ blockType: 'quote', text: block.text })
          break
        case 'video':
          body.push({ blockType: 'video', embed: block.embed, title: block.title })
          break
        default:
          console.warn(`  ! неизвестный блок «${block.type}» в ${article.slug}`)
      }
    }

    await upsert('news', 'slug', article.slug, {
      slug: article.slug,
      title: article.title,
      shortTitle: article.shortTitle,
      excerpt: article.excerpt,
      readingTime: article.readingTime,
      date: parseRuDate(article.date),
      image: article.image ? await mediaId(article.image, article.imageAlt || article.title) : undefined,
      imageAlt: article.imageAlt,
      isConference: conferenceSlugs.includes(article.slug),
      author: article.author
        ? { name: article.author.name, role: article.author.role }
        : { name: 'Общество изучения традиционного тайцзицюань' },
      body,
      _status: 'published',
    })
    console.log(`  ✓ ${article.slug}`)
  }
}

// ─── Медиа-архив ───────────────────────────────────────────────────────

async function migrateVideos() {
  console.log(`\n▸ Видео: ${data.videos.length}`)
  for (const video of data.videos) {
    await upsert('videos', 'slug', video.id, {
      slug: video.id,
      title: video.title,
      date: parseRuDate(video.date),
      desc: strip(video.desc),
      embeds: video.embeds.map((e: any) => ({ src: e.src, label: e.label })),
    })
    console.log(`  ✓ ${video.id}`)
  }
}

// ─── Исследования ──────────────────────────────────────────────────────

async function migrateResearch() {
  const all = [
    ...data.sources.map((item: any, i: number) => ({ ...item, kind: 'source', order: i })),
    ...data.publications.map((item: any, i: number) => ({ ...item, kind: 'publication', order: i })),
  ]
  console.log(`\n▸ Исследования: ${all.length}`)

  for (const item of all) {
    await upsert('research', 'url', item.url, {
      title: item.title,
      desc: item.desc,
      url: item.url,
      label: item.label,
      kind: item.kind,
      year: item.year,
      order: item.order,
    })
    console.log(`  ✓ ${item.title.slice(0, 60)}`)
  }
}

// ─── Команда Общества ──────────────────────────────────────────────────

async function migrateTeam() {
  console.log(`\n▸ Команда: ${data.teamBios.length}`)
  for (const [i, bio] of data.teamBios.entries()) {
    const portrait = path.join(webSrc, `assets/society/team-${i + 1}.webp`)
    await upsert('team', 'name', bio.name, {
      name: bio.name,
      role: bio.role,
      portrait: await mediaId(portrait, `${bio.name} — ${bio.role}`),
      description: strip(bio.description),
      history: bio.history.map((entry: any) =>
        typeof entry === 'string'
          ? { text: entry, items: [] }
          : { text: entry.text, items: strip(entry.items) },
      ),
      order: i,
    })
    console.log(`  ✓ ${bio.name}`)
  }
}

// ─── Персоналии тайцзицюань ────────────────────────────────────────────

async function migratePersons() {
  console.log(`\n▸ Источники персоналий: ${data.personSources.length}`)
  const sourceIds = new Map<number, number>()

  for (const source of data.personSources) {
    const doc = await upsert('taiji-sources', 'n', source.n, {
      n: source.n,
      title: source.title,
      desc: source.desc,
      url: source.url ?? undefined,
      label: source.label ?? undefined,
    })
    sourceIds.set(source.n, doc.id as number)
  }
  console.log(`  ✓ загружены`)

  // Портреты жили в компоненте, а не в датасете: 5 из общественного достояния
  // (Wikimedia Commons), портрет У Цзяньцюаня — веб-превью по указанию заказчика.
  const PORTRAITS: Record<string, string> = {
    'chen-wangting': 'assets/taiji/persons/chen-wangting.jpg',
    'yang-luchan': 'assets/taiji/persons/yang-luchan.jpg',
    'wu-yuxiang': 'assets/taiji/persons/wu-yuxiang.jpg',
    'yang-chengfu': 'assets/taiji/persons/yang-chengfu.jpg',
    'sun-lutang': 'assets/taiji/persons/sun-lutang.jpg',
    'wu-jianquan': 'assets/taiji/persons/wu-jianquan.webp',
  }

  console.log(`\n▸ Персоналии: ${data.persons.length}`)
  for (const [i, person] of data.persons.entries()) {
    await upsert('persons', 'name', person.name, {
      name: person.name,
      cjk: person.cjk,
      line: person.line,
      card: person.card,
      meta: person.meta,
      bio: strip(person.bio),
      portrait: PORTRAITS[person.id]
        ? await mediaId(path.join(webSrc, PORTRAITS[person.id]), person.name)
        : undefined,
      sources: (person.sourceNs || []).map((n: number) => sourceIds.get(n)).filter(Boolean),
      order: i,
    })
    console.log(`  ✓ ${person.name}`)
  }
}

// ─── Документы Общества ────────────────────────────────────────────────

async function migrateDocuments() {
  const docs = [
    {
      title: 'Устав',
      subtitle: 'Принят на учредительном собрании 04.03.2024 г.',
      file: 'ustav.pdf',
      order: 0,
    },
    {
      title: 'Протокол учредительного собрания',
      subtitle: 'Общества изучения традиционного тайцзицюань от 04.03.2025 г.',
      file: 'protokol.pdf',
      order: 1,
    },
  ]
  console.log(`\n▸ Документы: ${docs.length}`)

  for (const doc of docs) {
    const filePath = path.join(repoRoot, 'apps/web/public/docs', doc.file)
    if (!fs.existsSync(filePath)) {
      console.warn(`  ! нет файла ${filePath}`)
      continue
    }

    const existing = await payload.find({
      collection: 'documents',
      where: { filename: { equals: doc.file } },
      limit: 1,
      pagination: false,
    })

    if (existing.docs.length) {
      await payload.update({
        collection: 'documents',
        id: existing.docs[0].id,
        data: { title: doc.title, subtitle: doc.subtitle, order: doc.order },
      })
    } else {
      await payload.create({
        collection: 'documents',
        data: { title: doc.title, subtitle: doc.subtitle, order: doc.order },
        filePath,
      })
    }
    console.log(`  ✓ ${doc.title}`)
  }
}

// ─── Глобалы: тексты страниц ───────────────────────────────────────────

async function migrateGlobals() {
  console.log('\n▸ Глобалы')
  const asset = (rel: string) => path.join(webSrc, rel)

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      phone: '+7 903 747 9367',
      phoneHref: '+79037479367',
      email: 'info@taiji-society.ru',
      address: 'Москва, Нахимовский проспект, д.32',
      workingHours: 'Пн – Пт: с 10:00 до 19:00',
      supportLine1: 'При академической поддержке',
      supportLine2: 'Института Китая и современной Азии РАН',
      socials: [
        { network: 'messenger', alt: 'Мессенджер', href: '#' },
        { network: 'telegram', alt: 'Telegram', href: '#' },
        { network: 'whatsapp', alt: 'WhatsApp', href: '#' },
        { network: 'vk', alt: 'ВКонтакте', href: '#' },
      ],
      mapEmbed:
        'https://yandex.ru/map-widget/v1/?um=constructor%3A17aa7c6da5bc66b337f00920483efe0bf6026e0db0b732306ff9c06ecddde557&source=constructor',
    },
  })
  console.log('  ✓ Настройки сайта')

  await payload.updateGlobal({
    slug: 'home',
    data: {
      cards: [
        {
          title: 'Общество',
          description:
            'Исследование, сохранение и развитие традиционного тайцзицюань в России',
          href: '/society',
          image: await mediaId(
            asset('assets/home/intro-society.webp'),
            'Тушевая иллюстрация: собрание за столом с книгами и свитками среди берёз',
          ),
          imageAlt:
            'Тушевая иллюстрация: собрание за столом с книгами и свитками среди берёз',
        },
        {
          title: 'Тайцзицюань',
          description: 'Традиция китайского внутреннего боевого искусства',
          href: '/taijiquan',
          image: await mediaId(
            asset('assets/home/intro-taijiquan.webp'),
            'Тушевая иллюстрация: мастер тайцзицюань в стойке у воды, бамбук и горы',
          ),
          imageAlt: 'Тушевая иллюстрация: мастер тайцзицюань в стойке у воды, бамбук и горы',
        },
      ],
    },
  })
  console.log('  ✓ Главная страница')

  await payload.updateGlobal({
    slug: 'about-block',
    data: {
      heading: 'О тайцзицюань',
      subtitle: 'Многовековая школа мысли, практики и наставничества',
      cards: [
        {
          title: 'История',
          desc: 'Происхождения и развития тайцзицюань как традиции, школы мысли и практики.',
          href: '/taijiquan/history',
          image: await mediaId(asset('assets/about/history-card.png'), 'История тайцзицюань'),
        },
        {
          title: 'Теория',
          desc: 'Основные понятия, принципы движения и идеи, на которых строится тайцзицюань.',
          href: '/taijiquan/theory',
          image: await mediaId(asset('assets/about/theory-card.png'), 'Теория тайцзицюань'),
        },
        {
          title: 'Практика',
          desc: 'Формы, упражнения и методы, через которые традиция передаётся и сохраняется.',
          href: '/taijiquan/practice',
          image: await mediaId(asset('assets/about/practice-card.png'), 'Практика тайцзицюань'),
        },
        {
          title: 'Персоналии',
          desc: 'Мастера, исследователи и носители традиции, повлиявшие на тайцзицюань.',
          href: '/taijiquan/person',
          image: await mediaId(asset('assets/about/persons-card.png'), 'Персоналии тайцзицюань'),
        },
      ],
    },
  })
  console.log('  ✓ Блок «О тайцзицюань»')

  await payload.updateGlobal({
    slug: 'society-page',
    data: {
      heroTitle: 'Исследование, сохранение и развитие традиционного тайцзицюань в России',
      missionHeading: 'Миссии и ценности',
      missionParagraphs: strip([
        'Общество изучения традиционного тайцзицюань создано как пространство для системного изучения, сохранения и осмысления тайцзицюань в его историческом, культурном и практическом контексте.',
        'Мы объединяем исследователей, преподавателей и практикующих, заинтересованных в глубоком понимании традиции, её методов, текстов, школ и линий передачи.',
        'Наша задача — развивать ответственное отношение к тайцзицюань: отличать исторические факты от легенд, уважительно работать с классическими источниками, изучать практику через живой опыт и сопоставлять традиционные представления с современными знаниями о движении, здоровье и обучении.',
        'Мы рассматриваем тайцзицюань не только как оздоровительную гимнастику или боевое искусство, а как целостную систему телесной культуры, в которой связаны история, философия, методика практики, работа с вниманием и передача опыта от учителя к ученику.',
      ]),
      values: [
        {
          title: 'Исследовательская добросовестность',
          description:
            'Внимательное изучение источников, терминов, исторических свидетельств и практических методов без упрощений и недостоверных утверждений.',
        },
        {
          title: 'Уважение к традиции',
          description:
            'Бережное отношение к культурным, философским и практическим основаниям тайцзицюань, а также к различным школам и линиям передачи.',
        },
        {
          title: 'Единство теории и практики',
          description:
            'Понимание тайцзицюань через непосредственный телесный опыт, регулярную практику и осмысленное изучение принципов.',
        },
        {
          title: 'Преемственность',
          description:
            'Сохранение и передача знаний от учителя к ученику с уважением к контексту, методике и ответственности традиционного обучения.',
        },
        {
          title: 'Междисциплинарность',
          description:
            'Соединение знаний из истории, философии, культурологии, медицины, биомеханики, педагогики и исследований движения.',
        },
        {
          title: 'Открытость',
          description:
            'Готовность к диалогу между разными школами, стилями, исследовательскими подходами и практическими сообществами.',
        },
      ],
    },
  })
  console.log('  ✓ Страница «Общество»')

  await payload.updateGlobal({
    slug: 'contacts-page',
    data: {
      heading: 'Контакты',
      ctaTitle: 'Отправить сообщение',
    },
  })
  console.log('  ✓ Страница «Контакты»')

  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      columns: [
        {
          title: 'Тайцзицюань',
          href: '/taijiquan',
          links: [
            { label: 'История', href: '/taijiquan/history' },
            { label: 'Теория', href: '/taijiquan/theory' },
            { label: 'Практика', href: '/taijiquan/practice' },
            { label: 'Персоналии', href: '/taijiquan/person' },
          ],
        },
        {
          title: 'Общество',
          href: '/society',
          links: [
            { label: 'Миссия и ценности', href: '/society#mission' },
            { label: 'Команда', href: '/society#team' },
            { label: 'Документы', href: '/society#documents' },
            { label: 'Партнёры', href: '/society#partners' },
          ],
        },
        {
          title: 'Исследования',
          href: '/research',
          links: [
            { label: 'Источники', href: '/research#sources' },
            { label: 'Публикации', href: '/research#publications' },
            { label: 'Конференции', href: '/research#conferences' },
            { label: 'Фестивали', href: '/research#festivals' },
          ],
        },
      ],
      bigLinks: [
        { label: 'Новости', href: '/news' },
        { label: 'Анонсы', href: '/events' },
        { label: 'Медиа-архив', href: '/media-archive' },
        { label: 'Контакты', href: '/contacts' },
      ],
      topNav: [
        { label: 'Общество', href: '/society' },
        { label: 'Тайцзицюань', href: '/taijiquan' },
        { label: 'Новости', href: '/news' },
        { label: 'Исследования', href: '/research' },
        { label: 'Анонсы', href: '/events' },
      ],
    },
  })
  console.log('  ✓ Навигация')
}

// ─────────────────────────────── запуск ────────────────────────────────

await migrateNews()
await migrateVideos()
await migrateResearch()
await migrateTeam()
await migratePersons()
await migrateDocuments()
await migrateGlobals()

console.log(`\nГотово. Загружено новых файлов: ${uploaded}.`)
process.exit(0)
