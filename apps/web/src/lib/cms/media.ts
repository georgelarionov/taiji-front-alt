// Видео медиа-архива (/media-archive). Форма — как в прежнем src/data/media.ts.

import { fetchCollection, formatRuDate } from './client'

export interface VideoEmbed {
  src: string
  label?: string
}

export interface MediaVideo {
  id: string
  date: string
  title: string
  desc: string[]
  embeds: VideoEmbed[]
}

let cache: Promise<MediaVideo[]> | undefined

export function getVideos(): Promise<MediaVideo[]> {
  cache ||= fetchCollection<any>('videos', { sort: '-date' }).then((docs) =>
    docs.map((doc) => ({
      id: doc.slug,
      date: formatRuDate(doc.date),
      title: doc.title,
      desc: (doc.desc || []).map((d: any) => d.text),
      embeds: (doc.embeds || []).map((e: any) => ({ src: e.src, label: e.label || undefined })),
    })),
  )
  return cache
}
