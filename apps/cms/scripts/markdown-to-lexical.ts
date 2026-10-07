// Строка с markdown-разметкой → значение richText-поля (Lexical JSON) для текстов
// новостей (fields/inline-editor). Нужен скриптам: переносу старых текстовых полей
// (migrate-rich-text) и импорту/сидингу новостей, где тексты приходят строками.
//
// Набор правил тот же, что был у сайта до визуального редактора: **жирный**,
// *курсив*, ~~зачёркнутый~~, [подпись](адрес), голые https-адреса, перевод строки →
// перенос (linebreak). Всё это — один абзац Lexical.
import { randomBytes } from 'node:crypto'

import MarkdownIt from 'markdown-it'

const md = new MarkdownIt('default', { html: false, linkify: true, breaks: true })
  // картинки и `код` в текстах статей не нужны — пусть остаются обычными символами
  .disable(['image', 'backticks'])
md.linkify.set({ fuzzyLink: false, fuzzyEmail: false, fuzzyIP: false }).add('//', null)
md.validateLink = (url) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(url.trim())

// Биты формата текста в Lexical (IS_BOLD / IS_ITALIC / IS_STRIKETHROUGH).
const FORMAT: Record<string, number> = { strong: 1, em: 2, s: 4 }

type LexicalNode = Record<string, unknown> & { type: string }

const textNode = (text: string, format: number): LexicalNode => ({
  type: 'text',
  text,
  format,
  style: '',
  mode: 'normal',
  detail: 0,
  version: 1,
})

const linkNode = (url: string): LexicalNode & { children: LexicalNode[] } => ({
  type: 'link',
  children: [],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 3,
  // внешние ссылки сайт и так открывает в новой вкладке; флаг — чтобы в админке
  // галочка «Открыть в новой вкладке» отражала то, что происходит на сайте
  fields: { url, newTab: /^https?:\/\//i.test(url), linkType: 'custom' },
  id: randomBytes(12).toString('hex'),
})

export function markdownToLexical(markdown: string) {
  const tokens = md.parseInline(markdown.trim(), {})[0]?.children ?? []
  const children: LexicalNode[] = []
  let link: ReturnType<typeof linkNode> | null = null
  let format = 0

  const push = (node: LexicalNode) => {
    const target = link ? link.children : children
    const prev = target[target.length - 1]
    // соседние куски текста с одинаковым форматом склеиваем в один узел
    if (node.type === 'text' && prev?.type === 'text' && prev.format === node.format) {
      prev.text = String(prev.text) + String(node.text)
    } else {
      target.push(node)
    }
  }

  for (const token of tokens) {
    const tag = token.type.replace(/_(open|close)$/, '')
    if (tag in FORMAT) {
      format = token.type.endsWith('_open') ? format | FORMAT[tag] : format & ~FORMAT[tag]
    } else if (token.type === 'link_open') {
      link = linkNode(String(token.attrGet('href') ?? ''))
    } else if (token.type === 'link_close') {
      if (link) children.push(link)
      link = null
    } else if (token.type === 'softbreak' || token.type === 'hardbreak') {
      push({ type: 'linebreak', version: 1 })
    } else if (token.content) {
      push(textNode(token.content, format))
    }
  }

  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children,
          direction: children.length ? 'ltr' : null,
          format: '',
          indent: 0,
          textFormat: 0,
          textStyle: '',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}
