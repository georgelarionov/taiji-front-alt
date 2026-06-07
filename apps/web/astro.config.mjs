// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

// Локальные woff2 лежат в src/assets/fonts/ (доки Astro не рекомендуют public/ — иначе дубли в сборке).
const fontsDir = './src/assets/fonts';

// https://astro.build/config
export default defineConfig({
  // TODO: заменить на реальный домен проекта (плейсхолдер .example) — нужно для canonical/OG/sitemap
  site: 'https://taiji-society.example',

  integrations: [react(), sitemap()],

  // Astro 6 Fonts API: скачивает/оптимизирует, генерирует @font-face, preload-ссылки и
  // метрически подогнанные fallback-шрифты (минимум CLS). Self-hosted, без сторонних запросов в рантайме.
  fonts: [
    // --- Inter (body / UI) — отдаём Fontsource: Astro сам скачает и вошьёт локально ---
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin', 'cyrillic'],
    },

    // --- Manrope (акценты / подзаголовки) — локальные файлы ---
    {
      provider: fontProviders.local(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
      options: {
        variants: [
          { weight: 200, style: 'normal', src: [`${fontsDir}/Manrope-ExtraLight.woff2`] },
          { weight: 300, style: 'normal', src: [`${fontsDir}/Manrope-Light.woff2`] },
          { weight: 400, style: 'normal', src: [`${fontsDir}/Manrope-Regular.woff2`] },
          { weight: 500, style: 'normal', src: [`${fontsDir}/Manrope-Medium.woff2`] },
          { weight: 600, style: 'normal', src: [`${fontsDir}/Manrope-SemiBold.woff2`] },
          { weight: 700, style: 'normal', src: [`${fontsDir}/Manrope-Bold.woff2`] },
          { weight: 800, style: 'normal', src: [`${fontsDir}/Manrope-ExtraBold.woff2`] },
        ],
      },
    },

    // --- Cormorant Garamond (заголовки / hero / цитаты) — локальные файлы, с курсивами ---
    {
      provider: fontProviders.local(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      fallbacks: ['serif'],
      options: {
        variants: [
          { weight: 300, style: 'normal', src: [`${fontsDir}/CormorantGaramond-Light.woff2`] },
          { weight: 300, style: 'italic', src: [`${fontsDir}/CormorantGaramond-LightItalic.woff2`] },
          { weight: 400, style: 'normal', src: [`${fontsDir}/CormorantGaramond-Regular.woff2`] },
          { weight: 400, style: 'italic', src: [`${fontsDir}/CormorantGaramond-Italic.woff2`] },
          { weight: 500, style: 'normal', src: [`${fontsDir}/CormorantGaramond-Medium.woff2`] },
          { weight: 500, style: 'italic', src: [`${fontsDir}/CormorantGaramond-MediumItalic.woff2`] },
          { weight: 600, style: 'normal', src: [`${fontsDir}/CormorantGaramond-SemiBold.woff2`] },
          { weight: 600, style: 'italic', src: [`${fontsDir}/CormorantGaramond-SemiBoldItalic.woff2`] },
          { weight: 700, style: 'normal', src: [`${fontsDir}/CormorantGaramond-Bold.woff2`] },
          { weight: 700, style: 'italic', src: [`${fontsDir}/CormorantGaramond-BoldItalic.woff2`] },
        ],
      },
    },
  ],

  vite: {
    plugins: [tailwindcss()],
    // Разрешаем туннели ngrok (ведущая точка = любой поддомен) — иначе Vite
    // отбивает запрос с чужого Host. Покрывает .dev / .app / .io варианты ngrok.
    server: {
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
    },
  }
});