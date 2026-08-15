// Ссылки внутри текстов новостей.
//
// В CMS тело статьи — это простые текстовые поля (см. lib/cms/news → Block), поэтому
// ссылка записывается markdown-разметкой прямо в тексте: [подпись](адрес). Здесь текст
// разбирается на куски, а ArticleBody.astro рендерит их <a>-элементами — БЕЗ set:html,
// так что содержимое остаётся экранированным.
//
// Дополнительно подхватываются «голые» адреса (https://…): при переносе контента со
// старого сайта часть ссылок уцелела именно так — текстом.

export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'link'; text: string; href: string }

/** [подпись](адрес) — подпись без вложенных скобок, адрес без пробелов. */
const MD_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g
/** Голый адрес; хвостовая пунктуация в ссылку не входит. */
const BARE_URL = /https?:\/\/[^\s<>()"']+[^\s<>()"'.,;:!?»)]/g

/**
 * Ссылкой считаем только внутренний путь и http(s). Всё прочее (javascript:, data:)
 * остаётся текстом — источник хоть и доверенный, но подставлять его в href незачем.
 */
function safeHref(href: string): string | null {
  if (href.startsWith('/') || href.startsWith('#')) return href
  if (/^https?:\/\//i.test(href)) return href
  if (/^(mailto|tel):/i.test(href)) return href
  return null
}

/** Ссылка ведёт наружу — открываем в новой вкладке. */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

/** Разбирает текст на обычные куски и ссылки. */
export function parseInlineLinks(input: string): InlineNode[] {
  const nodes: InlineNode[] = []
  let cursor = 0

  const pushText = (value: string) => {
    if (!value) return
    // внутри обычного текста ещё могут быть голые адреса
    let last = 0
    for (const m of value.matchAll(BARE_URL)) {
      const start = m.index ?? 0
      if (start > last) nodes.push({ type: 'text', value: value.slice(last, start) })
      nodes.push({ type: 'link', text: m[0], href: m[0] })
      last = start + m[0].length
    }
    if (last < value.length) nodes.push({ type: 'text', value: value.slice(last) })
  }

  MD_LINK.lastIndex = 0
  for (const m of input.matchAll(MD_LINK)) {
    const start = m.index ?? 0
    pushText(input.slice(cursor, start))
    const href = safeHref(m[2])
    if (href) nodes.push({ type: 'link', text: m[1], href })
    else nodes.push({ type: 'text', value: m[0] })
    cursor = start + m[0].length
  }
  pushText(input.slice(cursor))

  return nodes
}

/** Есть ли в тексте хоть одна ссылка (чтобы не гонять разбор зря). */
export function hasInlineLinks(input: string): boolean {
  return input.includes('](') || /https?:\/\//i.test(input)
}
