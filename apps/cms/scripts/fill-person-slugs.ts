// Слаги для уже заведённых людей — «Команды Общества» (team) и «Персоналий» (persons).
// Слаг — якорь человека на сайте (/society#<слаг>, /taijiquan/person#<слаг>). Новым
// записям его ставит поле slugField при сохранении, а старым этот разовый прогон.
//
//   pnpm --filter cms fill-person-slugs            # показать, что будет записано
//   pnpm --filter cms fill-person-slugs -- --apply # записать в базу
//
// Пишет прямо в таблицы Postgres: хуки и updatedAt не трогаются. Колонка `slug`
// добавляется, если её ещё нет (уникальный индекс потом создаст push схемы).
// Идемпотентно: заполняются только пустые слаги; совпадения получают хвост -2, -3…
//
// Слаги — прежние id из src/data (фамилия у команды, пиньинь у персоналий): транслит
// китайского имени дал бы «yan-luchan» вместо привычного «yang-luchan». Кого нет в
// списке — транслит имени, как у поля slugField.
import 'dotenv/config'

// подключаемся без автоматического push — схему меняет только push-schema
process.env.PAYLOAD_MIGRATING = 'true'

import { getPayload } from 'payload'

import { slugify } from '../src/lib/slugify'
import config from '../src/payload.config'

const APPLY = process.argv.includes('--apply')

const LEGACY: Record<string, Record<string, string>> = {
  team: {
    'Воскресенский Станислав Сергеевич': 'voskresensky',
    'Бабаев Кирилл Владимирович': 'babaev',
    'Марченко Артём Васильевич': 'marchenko',
    'Палецкий Денис Яковлевич': 'paletsky',
    'Пиковер Александр Владимирович': 'pikover',
    'Петровский Дмитрий Иванович': 'petrovsky',
  },
  persons: {
    'Чэнь Вантин': 'chen-wangting',
    'Ян Лучань': 'yang-luchan',
    'У Юйсян': 'wu-yuxiang',
    'У Цзяньцюань': 'wu-jianquan',
    'Ян Чэнфу': 'yang-chengfu',
    'Сунь Лутан': 'sun-lutang',
  },
}

const payload = await getPayload({ config })
const pool = (payload.db as any).pool
const client = await pool.connect()

try {
  await client.query('BEGIN')

  for (const [table, legacy] of Object.entries(LEGACY)) {
    await client.query(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "slug" varchar`)
    const { rows } = await client.query(`SELECT id, name, slug FROM "${table}" ORDER BY id`)
    const taken = new Set(rows.map((r: any) => r.slug).filter(Boolean))

    for (const row of rows.filter((r: any) => !r.slug)) {
      const base = legacy[row.name.trim()] || slugify(row.name) || `person-${row.id}`
      let slug = base
      for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`
      taken.add(slug)

      console.log(`${table}#${row.id} ${row.name} → ${slug}`)
      if (APPLY) await client.query(`UPDATE "${table}" SET slug = $1 WHERE id = $2`, [slug, row.id])
    }
  }

  await client.query(APPLY ? 'COMMIT' : 'ROLLBACK')
  console.log(APPLY ? 'Готово: записано.' : 'Пробный прогон: в базу не записано (--apply).')
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
