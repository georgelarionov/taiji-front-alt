// Доступ к Payload CMS. Работает ТОЛЬКО на сборке: сайт статический, поэтому все
// запросы уходят один раз при `astro build` и запекаются в HTML.
//
// Адрес CMS берётся из CMS_URL. Локально — http://localhost:3000 (pnpm --filter cms dev),
// на Railway — переменная сервиса web.
//
// Если CMS недоступна, сборка падает с внятным сообщением. Это осознанно: молча
// собрать сайт с пустыми разделами хуже, чем не собрать вовсе.

const CMS_URL =
  import.meta.env.CMS_URL || process.env.CMS_URL || 'http://localhost:3000'

export interface CmsImage {
  url: string
  width: number
  height: number
  alt: string
  caption?: string
  credit?: string
}

/** Ответ коллекции Payload (список документов). */
interface CmsList<T> {
  docs: T[]
}

async function request<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const url = new URL(`/api/${path}`, CMS_URL)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }

  let res: Response
  try {
    res = await fetch(url)
  } catch (cause) {
    throw new Error(
      `Не достучался до CMS по адресу ${CMS_URL}. Запустите её (pnpm --filter cms dev) ` +
        `или проверьте переменную CMS_URL.`,
      { cause },
    )
  }

  if (!res.ok) {
    throw new Error(`CMS ответила ${res.status} ${res.statusText} на ${url.pathname}`)
  }

  return res.json() as Promise<T>
}

/** Все документы коллекции. Лимит выставлен с запасом — сайт небольшой. */
export async function fetchCollection<T>(
  collection: string,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  const data = await request<CmsList<T>>(collection, {
    limit: 500,
    depth: 1,
    ...params,
  })
  return data.docs
}

/** Значение глобала (тексты страницы, настройки). */
export async function fetchGlobal<T>(
  slug: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  return request<T>(`globals/${slug}`, { depth: 1, ...params })
}

/** Медиафайл Payload → форма, которую понимает наш <CmsPicture>. */
export function toImage(media: unknown, altOverride?: string): CmsImage | undefined {
  if (!media || typeof media !== 'object') return undefined
  const m = media as Record<string, any>
  if (!m.url || !m.width || !m.height) return undefined

  return {
    // Payload отдаёт абсолютный URL, если у него задан serverURL; на всякий случай
    // достраиваем относительный путь сами.
    url: m.url.startsWith('http') ? m.url : new URL(m.url, CMS_URL).href,
    width: m.width,
    height: m.height,
    alt: altOverride || m.alt || '',
    caption: m.caption || undefined,
    credit: m.credit || undefined,
  }
}

const RU_DATE = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** ISO-дата из CMS → «3 июня 2026 г.» (формат, к которому свёрстан сайт). */
export function formatRuDate(iso: string): string {
  return RU_DATE.format(new Date(iso))
}

export { CMS_URL }
