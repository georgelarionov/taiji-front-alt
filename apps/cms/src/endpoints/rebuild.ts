import type { Endpoint } from 'payload'

import { triggerSiteRebuild } from '../lib/railway'

// POST /api/rebuild-site — просит Railway пересобрать сайт.
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
