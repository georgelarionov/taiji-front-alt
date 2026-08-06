import type { Endpoint } from 'payload'

import { triggerSiteRebuild } from '../lib/publish'

// POST /api/rebuild-site — ставит пересборку сайта в очередь.
// Куда именно уходит запрос (свой сервер или Railway) — решает ../lib/publish.
// Только для залогиненных редакторов: кнопка живёт в админке.
export const rebuildEndpoint: Endpoint = {
  path: '/rebuild-site',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Нужно войти в админку.' }, { status: 401 })
    }

    const result = await triggerSiteRebuild()

    if (!result.ok) {
      req.payload.logger.error(`Пересборка сайта не запустилась: ${result.error}`)
      return Response.json({ error: result.error }, { status: 502 })
    }

    req.payload.logger.info(`Пересборка сайта запущена (${req.user.email}).`)
    return Response.json({ ok: true })
  },
}
