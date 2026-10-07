// Оформление внутри текстов новостей.
//
// В CMS тело статьи — это простые текстовые поля (см. lib/cms/news → Block), поэтому
// оформление записывается прямо в тексте markdown-разметкой:
//   **жирный** · *курсив* (или _курсив_) · ***жирный курсив*** · ~~зачёркнутый~~ ·
//   [подпись](адрес) · Enter внутри поля — перенос строки · \* — звёздочка как есть.
// «Голые» адреса (https://…) тоже становятся ссылками: при переносе контента со старого
// сайта часть ссылок уцелела именно так — текстом.
//
// Разбор — markdown-it в строчном режиме (renderInline: без абзацев, заголовков и
// списков). Сырой HTML выключен (html: false) — всё, что редактор впишет в угловых
// скобках, экранируется; для вставки разметки есть отдельный блок «HTML-код».
import MarkdownIt from 'markdown-it'

const LINK_CLASS =
  'text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent'

const md = new MarkdownIt('default', { html: false, linkify: true, breaks: true })
  // картинки и `код` в текстах статей не нужны — пусть остаются обычными символами
  .disable(['image', 'backticks'])

// Только явные http(s)-адреса: «example.com» и e-mail без схемы ссылками не становятся,
// как и раньше.
md.linkify.set({ fuzzyLink: false, fuzzyEmail: false, fuzzyIP: false }).add('//', null)

/**
 * Ссылкой считаем только внутренний путь, http(s), mailto: и tel:. Всё прочее
 * (javascript:, data:, относительные пути без «/») остаётся текстом.
 */
md.validateLink = (url) => /^(\/|#|https?:\/\/|mailto:|tel:)/i.test(url.trim())

/** Ссылка ведёт наружу — открываем в новой вкладке. */
function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const token = tokens[idx]
  token.attrSet('class', LINK_CLASS)
  if (isExternal(String(token.attrGet('href') ?? ''))) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noopener noreferrer')
  }
  return self.renderToken(tokens, idx, options)
}

/** Текст из CMS → безопасный HTML для вставки внутрь <p>/<li>/<figcaption>/<blockquote>. */
export function renderInline(text: string): string {
  return md.renderInline(text.trim())
}
