// Синхронизация схемы Postgres с конфигом Payload — то же, что делает `pnpm dev`
// при старте (push), но с явным списком SQL и без интерактивного вопроса.
//
//   pnpm --filter cms push-schema            # показать, что изменится
//   pnpm --filter cms push-schema -- --apply # применить
//
// Нужен, когда меняется схема боевой базы (новый блок/поле, снятие старых колонок):
// миграций в проекте нет, а dev-push на удаляющих изменениях ждёт ответа в терминале.
// Запускать через SSH-туннель к боевой базе (см. .env) — и сначала смотреть список.
import 'dotenv/config'

// подключаемся без автоматического push — он и есть то, что мы хотим сначала увидеть
process.env.PAYLOAD_MIGRATING = 'true'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const APPLY = process.argv.includes('--apply')

const payload = await getPayload({ config })
const adapter = payload.db as any
const { pushSchema } = adapter.requireDrizzleKit()
const { apply, hasDataLoss, statementsToExecute, warnings } = await pushSchema(
  adapter.schema,
  adapter.drizzle,
  adapter.schemaName ? [adapter.schemaName] : undefined,
  adapter.tablesFilter,
)

if (!statementsToExecute.length) {
  console.log('Схема совпадает с конфигом — менять нечего.')
} else {
  console.log(`SQL (${statementsToExecute.length}):\n${statementsToExecute.join('\n')}\n`)
  if (warnings.length) console.log(`Предупреждения:\n${warnings.join('\n')}\n`)
  if (hasDataLoss) console.log('ВНИМАНИЕ: изменения удаляют данные.\n')
  if (APPLY) {
    await apply()
    console.log('Применено.')
  } else {
    console.log('Ничего не применено (--apply).')
  }
}

await payload.destroy()
// пул соединений Payload держит процесс живым и после destroy()
process.exit()
