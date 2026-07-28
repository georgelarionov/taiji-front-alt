// Оптимизация картинки CMS вне разметки — там, где нужен готовый URL, а не тег
// <Image>: портреты уходят пропсами в React-острова (слайдер, дровер), а острова
// компонент Astro отрендерить не могут.
//
// Для удалённого файла Astro требует явные размеры — считаем высоту по пропорции
// оригинала (её отдаёт API вместе с URL).

import { getImage } from 'astro:assets'

import type { CmsImage } from './client'

export async function optimizedSrc(image: CmsImage, width: number): Promise<string> {
  const height = Math.round((image.height / image.width) * width)
  const result = await getImage({ src: image.url, width, height, format: 'webp' })
  return result.src
}
