// Тексты новостей из визуального редактора CMS (richText-поле Payload, Lexical JSON)
// → HTML. Редактор (apps/cms → fields/inline-editor) разрешает только строчное
// оформление: жирный, курсив, зачёркнутый, ссылку, плюс абзацы и переносы строк —
// здесь разбираются ровно эти узлы. Неизвестный узел с детьми выводится как его
// содержимое, без обёртки, — текст не теряется.
//
// HTML собирается строкой: весь текст и адреса экранируются, ссылки пропускаются
// только на /, #, http(s), mailto и tel.

const LINK_CLASS =
  'text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent'

// Биты формата текста в Lexical → теги, изнутри наружу.
const FORMATS: [bit: number, tag: string][] = [
  [64, 'sup'],
  [32, 'sub'],
  [4, 's'],
  [8, 'u'],
  [2, 'em'],
  [1, 'strong'],
]

interface LexicalNode {
  type: string
  text?: string
  format?: number | string
  children?: LexicalNode[]
  fields?: { url?: string; newTab?: boolean; linkType?: string }
}

export interface RichText {
  root: LexicalNode
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Адрес ссылки: только безопасные схемы; «www.…»/«site.ru/…» без схемы — https. */
function safeHref(raw: string | undefined): string | null {
  let url = (raw ?? '').trim()
  // Payload кодирует адрес, не прошедший его проверку (encodeURIComponent): вернём «/»
  if (!url.includes('/') && /%2F/i.test(url)) url = decodeURIComponent(url)
  if (/^(\/|#|https?:\/\/|mailto:|tel:)/i.test(url)) return url
  if (/^[\p{L}\d-]+(\.[\p{L}\d-]+)+(\/|$)/u.test(url)) return `https://${url}`
  return null
}

function renderNode(node: LexicalNode): string {
  switch (node.type) {
    case 'text': {
      let html = escapeHtml(node.text ?? '')
      const format = typeof node.format === 'number' ? node.format : 0
      for (const [bit, tag] of FORMATS) if (format & bit) html = `<${tag}>${html}</${tag}>`
      return html
    }
    case 'linebreak':
      return '<br>'
    case 'tab':
      return ' '
    case 'link':
    case 'autolink': {
      const inner = renderChildren(node)
      const href = node.fields?.linkType === 'internal' ? null : safeHref(node.fields?.url)
      if (!href) return inner
      // внешние ссылки открываем в новой вкладке всегда — как и до редактора
      const blank = node.fields?.newTab || /^https?:\/\//i.test(href)
      const target = blank ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(href)}" class="${LINK_CLASS}"${target}>${inner}</a>`
    }
    default:
      return renderChildren(node)
  }
}

const renderChildren = (node: LexicalNode) => (node.children ?? []).map(renderNode).join('')

/** HTML каждого непустого абзаца — для блока «Абзац», где абзац = свой <p>. */
export function richTextParagraphs(value: RichText | null | undefined): string[] {
  return (value?.root?.children ?? [])
    .map((paragraph) => renderNode(paragraph).trim())
    // пустые абзацы (лишний Enter в конце) не выводим
    .filter((html) => html.replace(/<[^>]*>/g, '').trim())
}

/** Весь текст одной строкой, абзацы через перенос, — для пункта списка и цитаты. */
export function richTextInline(value: RichText | null | undefined): string {
  return richTextParagraphs(value).join('<br>')
}
