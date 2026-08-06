// Запуск пересборки сайта — общая точка входа для кнопки «Опубликовать на сайте».
//
// Хостингов у проекта два, и просят они разного:
//
//   • Свой сервер (Ubuntu + systemd, боевой вариант). Сайт собирается тут же,
//     рядом с CMS. Права на `systemctl start` у пользователя CMS нет и быть не
//     должно, поэтому запуск идёт через файл-триггер: пишем метку времени в
//     REBUILD_TRIGGER_FILE, а systemd-юнит `taiji-build.path` видит изменение
//     файла и запускает `taiji-build.service`. Никаких привилегий, никакого
//     shell-exec из веб-процесса.
//
//   • Railway (старый деплой). Там сборка живёт в отдельном сервисе, и дёргать
//     нужно их GraphQL API — вся механика и её подводные камни описаны в
//     ./railway.ts.
//
// Выбор — по наличию REBUILD_TRIGGER_FILE: задан → свой сервер, нет → Railway.

import { writeFile } from 'fs/promises'

import { triggerSiteRebuild as triggerRailwayRebuild, type RebuildResult } from './railway'

export type { RebuildResult }

export async function triggerSiteRebuild(): Promise<RebuildResult> {
  const triggerFile = process.env.REBUILD_TRIGGER_FILE

  if (!triggerFile) return triggerRailwayRebuild()

  try {
    // Содержимое не важно — systemd реагирует на сам факт записи. Время внутри
    // оставляем для диагностики: видно, когда последний раз жали кнопку.
    await writeFile(triggerFile, `${new Date().toISOString()}\n`, 'utf8')
    return { ok: true }
  } catch (cause) {
    return {
      ok: false,
      error: `Не получилось поставить сборку в очередь (${triggerFile}): ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    }
  }
}
