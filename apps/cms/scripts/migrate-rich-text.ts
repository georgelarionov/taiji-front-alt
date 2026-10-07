// Перенос текстов новостей из прежних текстовых полей (markdown-строка в колонке
// `text`) в richText-поля `content` визуального редактора (fields/inline-editor).
//
//   pnpm --filter cms migrate:rich-text            # пробный прогон: конвертация + проверка
//   pnpm --filter cms migrate:rich-text -- --apply # записать в базу
//
// Работает прямо по таблицам Postgres — и по самим новостям, и по их версиям
// (_news_v_*), чтобы восстановление старой версии в админке не давало пустых
// абзацев. Payload-хуки не дёргаются, лишних версий и новых updatedAt не появляется.
// Колонка `content` добавляется, если её нет; `text` не трогается (её потом снимет
// push схемы). Идемпотентно: заполняются только строки с пустым `content`.
//
// Каждое значение перед записью прогоняется через headless-редактор Lexical с теми
// же узлами, что в админке: если JSON не читается или читается не так, прогон
// падает, ничего не записав.
import 'dotenv/config'

// Без этого Payload при подключении сам «пушит» схему из конфига и снёс бы `text`
// раньше, чем тексты перенесены.
process.env.PAYLOAD_MIGRATING = 'true'

import { editorConfigFactory, getEnabledNodes, validateUrl } from '@payloadcms/richtext-lexical'
import { createHeadlessEditor } from '@payloadcms/richtext-lexical/lexical/headless'
import { getPayload } from 'payload'

import { INLINE_FEATURES } from '../src/fields/inline-editor'
import config from '../src/payload.config'
import { markdownToLexical } from './markdown-to-lexical'

const APPLY = process.argv.includes('--apply')

const TABLES = [
  'news_blocks_paragraph',
  '_news_v_blocks_paragraph',
  'news_blocks_list_items',
  '_news_v_blocks_list_items',
  'news_blocks_quote',
  '_news_v_blocks_quote',
]

/** Рекурсивно сортирует ключи — чтобы сравнивать JSON без учёта их порядка. */
const canonical = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
        )
      : value

const collectUrls = (node: any, out: string[] = []): string[] => {
  if (node?.type === 'link') out.push(node.fields?.url)
  for (const child of node?.children ?? []) collectUrls(child, out)
  return out
}

const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.fromFeatures({
  config: payload.config,
  features: INLINE_FEATURES,
})
const editor = createHeadlessEditor({ nodes: getEnabledNodes({ editorConfig }) })

const pool = (payload.db as any).pool
const client = await pool.connect()
let failed = 0

try {
  await client.query('BEGIN')

  for (const table of TABLES) {
    await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "content" jsonb`)
    const { rows } = await client.query(
      `SELECT id, text FROM "${table}" WHERE content IS NULL AND text IS NOT NULL ORDER BY id`,
    )

    let links = 0
    for (const row of rows) {
      const json = markdownToLexical(row.text)

      // проверка: headless-редактор с узлами админки читает JSON и отдаёт его же
      editor.setEditorState(editor.parseEditorState(JSON.stringify(json)))
      const roundTrip = editor.getEditorState().toJSON()
      if (JSON.stringify(canonical(roundTrip)) !== JSON.stringify(canonical(json))) {
        failed++
        console.error(`✗ ${table}#${row.id}: редактор читает JSON иначе`)
        console.error('  было:  ', JSON.stringify(canonical(json)).slice(0, 400))
        console.error('  стало: ', JSON.stringify(canonical(roundTrip)).slice(0, 400))
        continue
      }
      // адрес, который не пройдёт проверку Payload, при следующем сохранении в
      // админке был бы испорчен encodeURIComponent'ом
      for (const url of collectUrls(json.root)) {
        links++
        if (!validateUrl(url)) {
          failed++
          console.error(`✗ ${table}#${row.id}: адрес не проходит validateUrl: ${url}`)
        }
      }

      if (APPLY) {
        await client.query(`UPDATE "${table}" SET content = $1 WHERE id = $2`, [json, row.id])
      }
    }
    console.log(`${table}: ${rows.length} строк, ${links} ссылок`)
  }

  if (failed) throw new Error(`${failed} ошибок — ничего не записано`)
  await client.query(APPLY ? 'COMMIT' : 'ROLLBACK')
  console.log(APPLY ? 'Готово: записано.' : 'Пробный прогон: всё сходится, в базу не записано (--apply).')
} catch (error) {
  await client.query('ROLLBACK')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  client.release()
  await payload.destroy()
  // пул соединений Payload держит процесс живым и после destroy()
  process.exit()
}
