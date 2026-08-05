// Разовая замена файла у существующего media-документа (id тот же — связи не рвутся).
//
// Запуск из apps/cms:
//   MEDIA_ID=43 MEDIA_FILE=<абсолютный путь> [MEDIA_ALT="…"] \
//   NODE_OPTIONS="--no-deprecation --import=tsx/esm" node scripts/replace-media-file.ts

import 'dotenv/config'

import fs from 'fs'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const id = Number(process.env.MEDIA_ID)
const filePath = process.env.MEDIA_FILE as string
const alt = process.env.MEDIA_ALT

if (!id || !filePath) throw new Error('Нужны MEDIA_ID и MEDIA_FILE.')
if (!fs.existsSync(filePath)) throw new Error(`Нет файла: ${filePath}`)

const payload = await getPayload({ config })

const updated = await payload.update({
  collection: 'media',
  id,
  data: alt ? { alt } : {},
  filePath,
})

console.log(`media #${id}: ${updated.filename} ${updated.width}×${updated.height}`)
console.log('sizes:', Object.values(updated.sizes || {}).map((s: any) => s?.filename).filter(Boolean).join(', '))
process.exit(0)
